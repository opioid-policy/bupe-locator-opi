"use client";
import { useState, useEffect, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import Turnstile, { useTurnstile } from 'react-turnstile';
import MapLoader from "./components/MapLoader";
import styles from "./Home.module.css";
import PharmacyListItem from './components/PharmacyListItem';
import TrendIndicator from './components/TrendIndicator';
import confetti from "canvas-confetti";
import ManualPharmacyEntry from './components/ManualPharmacyEntry';

// --- Types ---
interface SearchSuggestion { name: string; mapbox_id: string; full_address: string; }
interface SelectedPharmacy {
  mapbox_id: string;
  name: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone_number: string;
}
type Coords = [number, number];
interface Stats {
  weeklyCount: number;
  totalCount?: number;
  zipCodeCount?: number;
}
export interface AggregatedPharmacy {
  id: string;
  name: string;
  coords: Coords;
  status: 'success' | 'denial';
  successCount: number;
  denialCount: number;
  lastUpdated: string;
  full_address: string;
  phone_number: string;
  standardizedNotes: string[];
  trend: 'up' | 'down' | 'neutral';
}
interface Report {
  pharmacyId: string;
  pharmacyName: string;
  reportType: 'success' | 'denial';
  latitude: number;
  longitude: number;
  submissionTime: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  standardizedNotes: string[];
}
const formulationOptions = [ 'Suboxone Film', 'Suboxone Tablet', 'Zubsolv Tablet', 'Buprenorphine/Naloxone Film (generic)', 'Buprenorphine/Naloxone Tablet (generic)', 'Buprenorphine Tablet (generic)', ];
const standardizedNoteOptions = [ 'Will order, but not in stock', 'Best to call ahead', 'Only fills for existing patients', 'Only fills from prescribers "close-by"', 'Requires specific diagnosis code', 'Long wait times', 'Won\'t accept cash', 'Helpful staff', 'Unhelpful staff' ];
export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [locationCoords, setLocationCoords] = useState<Coords | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mode, setMode] = useState<'find' | 'report' | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [selectedPharmacy, setSelectedPharmacy] = useState<SelectedPharmacy | null>(null);
  const [reportType, setReportType] = useState<'success' | 'denial' | ''>('');
  const [formulations, setFormulations] = useState<string[]>([]);
  const [standardizedNotes, setStandardizedNotes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [consentMap, setConsentMap] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [stats, setStats] = useState<Stats | null>(null);
  const [finalStats, setFinalStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [aggregatedPharmacies, setAggregatedPharmacies] = useState<Record<string, AggregatedPharmacy>>({});
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(true);
  const [dateFilter, setDateFilter] = useState<number | null>(30);
  const turnstile = useTurnstile();
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Client-side rate limiting state
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const REQUEST_DELAY_MS = 2000; // 2 seconds between requests
  
  // Scroll to top when mode changes or after successful submission
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode, submitStatus]);

  // --- Reset submit status on form open or change ---
  useEffect(() => {
    if (mode === 'report') {
      setSubmitStatus('idle');
    }
  }, [mode]);

  // Specific scroll effect for after successful submission
  useEffect(() => {
    if (submitStatus === 'success') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [submitStatus]);

const handleSelectPharmacy = async (pharmacy: SearchSuggestion) => {
  setSubmitStatus('idle');
  
  // Check if this is the manual entry option
  if (pharmacy.mapbox_id === 'manual_entry') {
    setShowManualEntry(true);
    setSearchTerm('');
    setResults([]);
    return;
  }
  
  try {
    // Use our new OSM-based pharmacy details API
    const response = await fetch('/api/pharmacy-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacy_id: pharmacy.mapbox_id })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle manual entry response
    if (data.features[0].properties.manual) {
      setShowManualEntry(true);
      return;
    }
    
    const feature = data.features[0];
    
    const street = feature.properties.address || '';
    const city = feature.properties.context.place?.name || '';
    const postcode = feature.properties.context.postcode?.name || '';
    const state = feature.properties.context.region?.region_code?.replace('US-', '') || '';
    const phone = feature.properties.phone || '';
    const [longitude, latitude] = feature.geometry.coordinates;
    
    setSelectedPharmacy({
      mapbox_id: pharmacy.mapbox_id,
      name: pharmacy.name,
      full_address: pharmacy.full_address,
      street_address: street,
      city: city,
      state: state,
      zip_code: postcode,
      latitude: latitude,
      longitude: longitude,
      phone_number: phone,
    });
    
    setSearchTerm('');
    setResults([]);
  } catch (error) {
    console.error("Error retrieving pharmacy details:", error);
    alert('Unable to load pharmacy details. Please try selecting a different pharmacy.');
  }
};

// Add handler for manual pharmacy submission
// Update handler for manual pharmacy submission
const handleManualPharmacySubmit = async (pharmacyData: SelectedPharmacy, turnstileToken: string) => {
  // Submit to your API with the turnstile token
  try {
    const response = await fetch('/api/submit-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pharmacy: pharmacyData,
        reportType: 'success', // Default to success for manual entries
        formulations: [],
        standardizedNotes: [],
        notes: 'Manually added pharmacy',
        turnstileToken: turnstileToken
      }),
    });
    
    if (response.ok) {
      setSelectedPharmacy(pharmacyData);
      setShowManualEntry(false);
      // Optionally show success message
    }
  } catch (error) {
    console.error('Error submitting manual pharmacy:', error);
  }
};
  // --- Reset error if user changes key form fields ---
  useEffect(() => {
    if (submitStatus === 'error') {
      setSubmitStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, consentMap, standardizedNotes, formulations, notes, selectedPharmacy]);

  // --- Browser back button logic ---
  useEffect(() => {
    const handlePopState = () => {
      if (mode) {
        setMode(null);
      } else if (locationCoords) {
        setLocationCoords(null);
        setZipCode('');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [mode, locationCoords]);

  // --- Stats fetch ---
  useEffect(() => {
    if (locationCoords && !mode) {
      const fetchStats = async () => {
        try {
          const response = await fetch('/api/stats');
          const data = await response.json();
          setStats(data);
        } catch (error) {
          console.error("Failed to fetch stats", error);
        }
      };
      fetchStats();
    }
  }, [locationCoords, mode]);

  // --- Pharmacy reports fetch ---
  useEffect(() => {
    if ((mode === 'find' || mode === 'report') && locationCoords) {
      setIsLoadingPharmacies(true);
      const fetchAllReports = async () => {
        try {
          const [lat, lon] = locationCoords;
          const response = await fetch(`/api/pharmacies?lat=${lat}&lon=${lon}`);
          const data: Report[] = await response.json();
          setAllReports(data);
        } catch (error) {
          console.error("Failed to fetch pharmacy reports:", error);
        } finally {
          setIsLoadingPharmacies(false);
        }
      };
      fetchAllReports();
    }
  }, [mode, locationCoords]);

  // --- Aggregate reports by pharmacy ---
  useEffect(() => {
    if (allReports.length === 0 && !isLoadingPharmacies) {
      setAggregatedPharmacies({});
      return;
    }
    
    const summary: Record<string, AggregatedPharmacy> = {};
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const report of allReports) {
      if (!summary[report.pharmacyId]) {
        const fullAddress = `${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`;
        summary[report.pharmacyId] = {
          id: report.pharmacyId,
          name: report.pharmacyName,
          coords: [report.latitude, report.longitude],
          status: 'denial',
          successCount: 0,
          denialCount: 0,
          lastUpdated: '',
          full_address: fullAddress,
          phone_number: report.phoneNumber,
          standardizedNotes: [],
          trend: 'neutral',
        };
      }
      if (report.reportType === 'success') {
        summary[report.pharmacyId].successCount++;
        if (
          !summary[report.pharmacyId].lastUpdated ||
          new Date(report.submissionTime) > new Date(summary[report.pharmacyId].lastUpdated)
        ) {
          summary[report.pharmacyId].lastUpdated = report.submissionTime;
        }
      } else {
        summary[report.pharmacyId].denialCount++;
      }
      if (report.standardizedNotes) {
        summary[report.pharmacyId].standardizedNotes.push(...report.standardizedNotes);
      }
    }
    for (const pharmacyId in summary) {
      const pharmacy = summary[pharmacyId];
      if (pharmacy.successCount > pharmacy.denialCount) {
        pharmacy.status = 'success';
      } else {
        pharmacy.status = 'denial';
      }
      const recentSuccesses = allReports.filter(
        r =>
          r.pharmacyId === pharmacyId &&
          r.reportType === 'success' &&
          new Date(r.submissionTime) > sevenDaysAgo
      ).length;
      const recentDenials = allReports.filter(
        r =>
          r.pharmacyId === pharmacyId &&
          r.reportType === 'denial' &&
          new Date(r.submissionTime) > sevenDaysAgo
      ).length;
      if (recentSuccesses > recentDenials) {
        pharmacy.trend = 'up';
      } else if (recentDenials > recentSuccesses) {
        pharmacy.trend = 'down';
      }
      summary[pharmacyId].standardizedNotes = [...new Set(summary[pharmacyId].standardizedNotes)];
    }
    setAggregatedPharmacies(summary);
  }, [allReports, isLoadingPharmacies]);

  // --- Mapbox ZIP code submit with client-side rate limiting and server-side API ---
  const handleZipCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const now = Date.now();

    // Client-side rate limiting check
    if (now - lastRequestTime < REQUEST_DELAY_MS) {
      setLocationError(`Please wait ${Math.ceil((REQUEST_DELAY_MS - (now - lastRequestTime)) / 1000)} seconds before trying again.`);
      return;
    }

    // ZIP code format validation
    if (!/^\d{5}$/.test(zipCode)) {
      setLocationError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setLastRequestTime(now);
    setIsLoadingLocation(true);
    setLocationError("");

    try {
      // Call your new API route instead of Mapbox directly
      const response = await fetch(`/api/zip?zipCode=${zipCode}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          setLocationError("Too many requests. Please try again in a minute.");
        } else if (response.status === 400) {
          setLocationError(errorData.message || "Invalid ZIP code format.");
        } else {
          setLocationError("Failed to fetch location data.");
        }
        return;
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].center;
        setLocationCoords([lat, lon]);
      } else {
        setLocationError("Could not find that ZIP code. Please try another.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setLocationError("Failed to fetch location data.");
    } finally {
      setIsLoadingLocation(false);
    }
  };
// --- Confetti effect ---
useEffect(() => {
  if (submitStatus === 'success' && mode === 'report') {
    const duration = 2 * 1000;
    const end = Date.now() + duration;
    const colors = ['#ff007a', '#00ff85', '#8500ff', '#ff8500'];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: colors
      });

      requestAnimationFrame(frame);
    };

    frame();
  }
}, [submitStatus, mode]);

  // --- OSM pharmacy suggest search ---
useEffect(() => {
  if (!locationCoords) return;
  if (!sessionToken) setSessionToken(crypto.randomUUID());
  if (searchTerm.length <= 2) {
    setResults([]);
    setIsSearching(false); // Add this state
    return;
  }

  setIsSearching(true); // Add this state

  const timer = setTimeout(() => {
    const fetchPharmacies = async () => {
      const [lat, lon] = locationCoords;
      const endpoint = `/api/pharmacy-search-hybrid?q=${encodeURIComponent(searchTerm)}&lat=${lat}&lon=${lon}`;      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        setResults(data.suggestions || []);
      } catch (error) {
        console.error("Error fetching pharmacies:", error);
        setResults([]);
      } finally {
        setIsSearching(false); // Always turn off loading
      }
    };
    fetchPharmacies();
  }, 500);

  return () => {
    clearTimeout(timer);
    setIsSearching(false);
  };
}, [searchTerm, locationCoords, sessionToken]);

  // --- Form helpers ---
  const handleFormulationChange = (option: string) => {
    setFormulations(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]);
  };
  const handleStandardizedNoteChange = (option: string) => {
    setStandardizedNotes(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]);
  };

  // --- Report submit ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    const reportData = {
      pharmacy: selectedPharmacy,
      reportType,
      formulations,
      standardizedNotes,
      notes,
      turnstileToken,
    };
    try {
      const response = await fetch('/api/submit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      if (!response.ok) throw new Error('Submission failed');
      // Reset Turnstile on submit for a new token on next attempt
      if (turnstile && typeof turnstile.reset === 'function') {
        turnstile.reset();
        setTurnstileToken(null);
      }
      const statsResponse = await fetch(`/api/stats?zip_code=${selectedPharmacy?.zip_code || ''}`);
      const statsData = await statsResponse.json();
      setFinalStats(statsData);
      setSubmitStatus('success');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      // Reset Turnstile on error so user can retry
      if (turnstile && typeof turnstile.reset === 'function') {
        turnstile.reset();
        setTurnstileToken(null);
      }
    }
    setIsSubmitting(false);
  };

  // --- Sharing helper ---
  const handleShare = () => {
    const shareText = `Know a pharmacy's status for buprenorphine? Help map access in our community: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- Form validation for submit button ---
  const canSubmit = !!(reportType && consentMap && turnstileToken && !isSubmitting && selectedPharmacy);
  const successfulPharmacies = useMemo(() => {
    return Object.values(aggregatedPharmacies)
      .filter(p => p.status === 'success')
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [aggregatedPharmacies]);
  const handleFilterClick = (days: number | null) => {
    if (dateFilter === days) {
      setDateFilter(null);
    } else {
      setDateFilter(days);
    }
  };

  if (!locationCoords) {
    return (
      <div className={styles.zipCodeContainer}>
        <form onSubmit={handleZipCodeSubmit}>
          <h2 >Enter Your ZIP Code</h2>
          <p style={{ color: 'var(--font-color-dark)', fontStyle: 'italic' }}>Please enter a ZIP code to find pharmacies with bupe near you.</p>
          <div className={styles.formGroup}>
            <label htmlFor="zip-code">ZIP Code</label>
            <input
              id="zip-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="e.g., 49506"
              required
            />
          </div>
          <button type="submit" className={styles.choiceButton} disabled={isLoadingLocation}>{isLoadingLocation ? 'Loading...' : 'Set Location'}</button>
          {locationError && <p className={styles.errorText}>{locationError}</p>}
        </form>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className={styles.choiceContainer}>
        <h2>What would you like to do?</h2>
        {stats && stats.weeklyCount > 0 && (
          <p className={styles.statsTextOnDark}>
            Join {stats.weeklyCount} {stats.weeklyCount === 1 ? 'person' : 'people'} who have submitted a report this week!
          </p>
        )}
        <div className={styles.choiceButtons}>
          <button className={styles.choiceButton} onClick={() => setMode('report')}>Update a Pharmacy&apos;s Bupe Status</button>
          <button className={styles.choiceButton} onClick={() => setMode('find')}>Find a Bupe-Friendly Pharmacy</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      {/* Only show map in 'find' mode */}
      {mode === 'find' && (
        <section className={styles.mapSection}>
          <MapLoader center={locationCoords} pharmacies={aggregatedPharmacies} />
        </section>
      )}

      <section className={styles.formSection}>
        {mode === 'find' && (
          <>
            <div className={styles.findHeader}>
              <h2>Bupe-Friendly Pharmacies</h2>
              <button onClick={() => window.print()} className={styles.printButton}>Print List</button>
            </div>
            <div className={styles.trendLegend}>
              <p>Trending Recently:</p>
              <div><TrendIndicator trend="up" /> <span>More Successes</span></div>
              <div><TrendIndicator trend="neutral" /> <span>Neutral</span></div>
              <div><TrendIndicator trend="down" /> <span>More Denials</span></div>
            </div>
            <div className={styles.filterGroup}>
              <button onClick={() => handleFilterClick(7)} className={`${styles.filterButton} ${dateFilter === 7 ? styles.active : ''}`}>Last 7 Days</button>
              <button onClick={() => handleFilterClick(15)} className={`${styles.filterButton} ${dateFilter === 15 ? styles.active : ''}`}>Last 15 Days</button>
              <button onClick={() => handleFilterClick(30)} className={`${styles.filterButton} ${dateFilter === 30 ? styles.active : ''}`}>Last 30 Days</button>
              <button onClick={() => handleFilterClick(null)} className={`${styles.filterButton} ${styles.allTimeButton} ${dateFilter === null ? styles.active : ''}`}>All Time</button>
            </div>
            {/* This is the printable content container */}
            <div className={styles.printableContent}>
              <div className={styles.pharmacyList}>
                {isLoadingPharmacies ? (
                  <p>Loading pharmacies...</p>
                ) : successfulPharmacies.length > 0 ? (
                  successfulPharmacies.map(pharmacy => (
                    <PharmacyListItem key={pharmacy.id} pharmacy={pharmacy} />
                  ))
                ) : (
                  <p>No successful reports found for the selected time period. Try a wider date range or select &quot;All Time&quot;.</p>
                )}
              </div>
              <div className={styles.printFooter}>
                <p>For the latest updates, visit bupe.opioidpolicy.org</p>
              </div>
            </div>
          </>
        )}
        {mode === 'report' && (
          <>
            {submitStatus === 'success' ? (
              <div className={styles.successMessage}>
                <h3>🎉 Thank You! 🎉</h3>
                {finalStats && (
                  <p className={styles.statsTextOnLight}>
                    {finalStats.zipCodeCount === 1 ? (
                      <>
                        Congratulations on being the first submission in your area!<br />
                        This is an important step towards increasing bupe access in your community.
                      </>
                    ) : (
                      <>
                        You are part of {finalStats.totalCount} total reports to our database.<br />
                        {finalStats.zipCodeCount && finalStats.zipCodeCount > 0 &&
                          `In your area, ${finalStats.zipCodeCount} reports have been made!`
                        }
                      </>
                    )}
                  </p>
                )}
                <p>We know filling a bupe script isn&apos;t always easy. Your answers help others in your area find this lifesaving medication.</p>
                <p><strong>The most helpful info is <em>new</em> info</strong>! So, the next time you try to fill a bupe script, tell us how it went. You can also help by sharing this website with friends who take bupe too.</p>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => {
                    setMode('find');
                    setSubmitStatus('idle');
                  }}
                >
                  Find Bupe-Friendly Pharmacies Near You
                </button>
                <button type="button" className={styles.submitButton} onClick={handleShare}>{copied ? 'Copied to Clipboard!' : 'Share with a Friend 🚀'}</button>
                <p style={{marginTop: '1.5rem', fontStyle: 'italic', fontSize: '0.9rem'}}><Link href="/bulk-upload" className={styles.styledLink}>If you&apos;re interested in submitting multiple reports, check out our bulk reporting tool.</Link></p>
              </div>
) : (
              <form onSubmit={handleSubmit}>
                <h2>Update Pharmacy&apos;s Bupe Status</h2>
                {showManualEntry ? (
                  <ManualPharmacyEntry
                    onBack={() => setShowManualEntry(false)}
                    onSubmit={handleManualPharmacySubmit}
                  />
                ) : (
                  <>
                    {!selectedPharmacy ? (
                      <>
                        <div className={styles.formGroup}>
                          <label htmlFor="pharmacy-search">Search for a Pharmacy</label>
                          <input
                            type="text"
                            id="pharmacy-search"
                            placeholder="e.g., CVS"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                          <div className={styles.resultsList}>
                            {results.filter(r => r.mapbox_id !== 'manual_entry').map((result) => (
                              <button
                                key={result.mapbox_id}
                                type="button"
                                className={styles.resultItem}
                                onClick={() => handleSelectPharmacy(result)}
                              >
                                <strong>{result.name}</strong>
                                <small>{result.full_address}</small>
                              </button>
                            ))}
                          </div>
                          {isSearching && <p style={{textAlign: 'center', padding: '0.5rem'}}>Searching...</p>}
                          {searchTerm && (
                            <button
                              type="button"
                              className={styles.manualEntryButton}
                              onClick={() => setShowManualEntry(true)}
                            >
                              + Can&apos;t find your pharmacy? Add it manually
                            </button>
                          )}
                      </>
                    ) : (
                      <>
                        <div className={styles.selectedPharmacy}>
                          <p><strong>{selectedPharmacy.name}</strong><br />{selectedPharmacy.full_address}</p>
                          <button type="button" onClick={() => setSelectedPharmacy(null)}>Change pharmacy</button>
                        </div>
                        <div className={styles.formGroup}>
                          <label>What was the outcome?</label>
                          <hr className={styles.formDivider} />
                          <div className={styles.radioGroup}>
                            <label>
                              <input
                                type="radio"
                                name="reportType"
                                value="success"
                                checked={reportType === 'success'}
                                onChange={(e) => setReportType(e.target.value as 'success' | 'denial')}
                              /> Success
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="reportType"
                                value="denial"
                                checked={reportType === 'denial'}
                                onChange={(e) => setReportType(e.target.value as 'success' | 'denial')}
                              /> Denial / Refusal
                            </label>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Formulation (optional, check all that apply)</label>
                          <hr className={styles.formDivider} />
                          <div className={styles.checkboxGroup}>
                            {formulationOptions.map(option => (
                              <label key={option} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  value={option}
                                  checked={formulations.includes(option)}
                                  onChange={() => handleFormulationChange(option)}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Common Observations (optional)</label>
                          <hr className={styles.formDivider} />
                          <div className={styles.checkboxGroup}>
                            {standardizedNoteOptions.map(option => (
                              <label key={option} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  value={option}
                                  checked={standardizedNotes.includes(option)}
                                  onChange={() => handleStandardizedNoteChange(option)}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="notes">Other Notes (optional)</label>
                          <hr className={styles.formDivider} />
                          <textarea
                            id="notes"
                            placeholder="e.g., 'Out of business.'"
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          ></textarea>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={consentMap}
                              onChange={(e) => setConsentMap(e.target.checked)}
                              required
                            />
                            I understand my anonymous report will be used to update the public map (REQUIRED).
                          </label>
                        </div>
                        <Turnstile
                          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                          onVerify={(token) => setTurnstileToken(token)}
                        />
                        <button
                          type="submit"
                          className={styles.submitButton}
                          style={{ marginTop: '1rem' }}
                          disabled={!canSubmit}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                        {submitStatus === 'error' && (
                          <p className={styles.errorText}>Submission failed. Please try again.</p>
                        )}
                      </>
                    )}
                  </>
                )}
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}