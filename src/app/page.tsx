"use client";

import { useState, useEffect, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import Turnstile, { useTurnstile } from 'react-turnstile';
import MapLoader from "./components/MapLoader";
import styles from "./Home.module.css";
import PharmacyListItem from './components/PharmacyListItem';
import TrendIndicator from './components/TrendIndicator';

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
const standardizedNoteOptions = [ 'Best to call ahead', 'Only fills for existing patients', 'Requires specific diagnosis code', 'Long wait times', 'Won\'t accept cash', 'Helpful/Kind Staff', 'Unhelpful/Stigmatizing Staff' ];

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
  const [consentResearch, setConsentResearch] = useState(false);
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

  // --- Mapbox pharmacy select ---
  const handleSelectPharmacy = async (pharmacy: SearchSuggestion) => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const endpoint = `https://api.mapbox.com/search/searchbox/v1/retrieve/${pharmacy.mapbox_id}?access_token=${accessToken}&session_token=${sessionToken}`;
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
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
    }
  };

  // --- Mapbox ZIP code submit ---
  const handleZipCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoadingLocation(true);
    setLocationError("");
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${accessToken}&types=postcode`;
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].center;
        setLocationCoords([lat, lon]);
      } else {
        setLocationError("Could not find that ZIP code. Please try another.");
      }
    } catch {
      setLocationError("Failed to fetch location data.");
    }
    setIsLoadingLocation(false);
  };

  // --- Mapbox pharmacy suggest search ---
  useEffect(() => {
    if (!locationCoords) return;
    if (!sessionToken) setSessionToken(crypto.randomUUID());
    if (searchTerm.length <= 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const fetchPharmacies = async () => {
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const [lat, lon] = locationCoords;
        const endpoint = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${searchTerm}&access_token=${accessToken}&language=en&session_token=${sessionToken}&proximity=${lon},${lat}&types=poi`;
        try {
          const response = await fetch(endpoint);
          const data = await response.json();
          setResults(data.suggestions || []);
        } catch (error) {
          console.error("Error fetching pharmacies:", error);
        }
      };
      fetchPharmacies();
    }, 300);
    return () => clearTimeout(timer);
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
      consentResearch,
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
  const canSubmit = !!(reportType && consentMap && turnstileToken && !isSubmitting);

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
          <button type="submit" className={styles.submitButton} disabled={isLoadingLocation}>{isLoadingLocation ? 'Loading...' : 'Set Location'}</button>
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
      <section className={styles.mapSection}>
        <MapLoader center={locationCoords} pharmacies={aggregatedPharmacies} />
      </section>
      <section className={styles.formSection}>
        {mode === 'find' && (
          <div className={styles.printableArea}>
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
        )}
        {mode === 'report' && (
          <>
            {submitStatus === 'success' ? (
              <div className={styles.successMessage}>
                <h3>🎉 Thank You! 🎉</h3>
                {finalStats && (
                  <p className={styles.statsTextOnLight}>
                    {finalStats.zipCodeCount === 1 ? (
                      "Congratulations on being the first submission in your area! This is an important step towards increasing access to bupe in your community."
                    ) : (
                      <>
                        You are part of {finalStats.totalCount} total contributions.
                        {finalStats.zipCodeCount && finalStats.zipCodeCount > 0 ? ` In your area, ${finalStats.zipCodeCount} reports have been made!` : ''}
                      </>
                    )}
                  </p>
                )}
                <p>Thank you for helping build this database. We know it can be difficult to fill a bupe script. Your data makes it easier for the community to find this lifesaving medication.</p>
                <p><strong>The best data is <em>fresh</em> data</strong>, so whenever you fill a script, remember to report to our database and share this with people you know who fill bupe scripts.</p>
                <button type="button" className={styles.submitButton} onClick={handleShare}>{copied ? 'Copied to Clipboard!' : 'Share with a Friend'}</button>
                <p style={{marginTop: '1.5rem', fontStyle: 'italic', fontSize: '0.9rem'}}><Link href="/bulk-upload" className={styles.styledLink}>If you&apos;re interested in submitting multiple reports, check out our bulk reporting tool.</Link></p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2>Update Pharmacy&apos;s Bupe Status</h2>
                {!selectedPharmacy ? (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="pharmacy-search">Search for a Pharmacy</label>
                      <input
                        type="text"
                        id="pharmacy-search"
                        placeholder="e.g., CVS on 28th St"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className={styles.resultsList}>
                      {results.map((result) => (
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
                        I understand my anonymous report will be used to update the public map (Required).
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={consentResearch}
                          onChange={(e) => setConsentResearch(e.target.checked)}
                        />
                        I consent for my anonymized data to be used for research purposes (Optional).
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
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}