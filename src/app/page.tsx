"use client";
import { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Turnstile, { useTurnstile } from 'react-turnstile';
import MapLoader from "./components/MapLoader";
import styles from "./Home.module.css";
import PharmacyListItem from './components/PharmacyListItem';
import TrendIndicator from './components/TrendIndicator';
import confetti from "canvas-confetti";
import ManualPharmacyEntry from './components/ManualPharmacyEntry';
import ErrorBoundary from './components/ErrorBoundary';
import { sanitize } from '@/utils/sanitize';
import { analytics } from '@/lib/privacy-analytics';
import { getStateFromZipCode } from '@/utils/state-utils';
import { T } from '@/lib/i18n-markers';
import { standardizedNoteKeys, getStandardizedNoteLabel} from '@/lib/form-options';
import { SponsorLogo } from "@/app/components/SponsorLogo";


const STATE_ABBR_TO_NAME: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming'
};

// --- Types ---
interface SearchSuggestion { name: string; osm_id: string; full_address: string; }
interface SelectedPharmacy {
  osm_id: string;
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

export interface AggregatedPharmacy {
  id: string;  // Keep as 'id'
  name: string;  // Keep as 'name'
  coords: Coords;
  status: 'success' | 'denial';
  successCount: number;
  denialCount: number;
  lastUpdated: string;
  full_address: string;  // Keep as 'full_address'
  phone_number: string;  // Keep as 'phone_number'
  city?: string;  
  state?: string;  
  zip?: number;  
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
const formulationOptions = [ 'Suboxone (film)', 'Buprenorphine/Naloxone (film; generic)', 'Buprenorphine/Naloxone (tablet; generic)', 'Buprenorphine (tablet; mono product; generic)', 'Zubsolv (tablet)',
  'Sublocade shot (fills prescription)',
  'Sublocade shot (gives shot)',
  'Brixadi shot (fills prescription)',
  'Brixadi shot (gives shot)' ];
export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
  const [selectedStandardizedNotes, setSelectedStandardizedNotes] = useState<string[]>([]); 
  const [notes, setNotes] = useState('');
  const [consentMap, setConsentMap] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [aggregatedPharmacies, setAggregatedPharmacies] = useState<Record<string, AggregatedPharmacy>>({});
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(true);
  const [dateFilter, setDateFilter] = useState<number | null>(30);
  const turnstile = useTurnstile();
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePrevPage = useCallback(() => {
  setCurrentPage(prev => Math.max(prev - 1, 1));
}, []);


const handleNextPage = useCallback(() => {
  setCurrentPage(prev => prev + 1);
}, []);

  const successfulPharmacies = useMemo(() =>
  Object.values(aggregatedPharmacies)
    .filter(p => p.status === 'success')
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()),
    [aggregatedPharmacies]);

  // Client-side rate limiting state
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const REQUEST_DELAY_MS = 2000; // 2 seconds between requests
  
  // Scroll to top when component mounts (immediate)
// Add this more comprehensive scroll effect that watches all relevant state changes
useEffect(() => {
  // Don't scroll if there's a hash in the URL
  if (!window.location.hash) {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Also scroll after a tiny delay to ensure DOM is updated
    setTimeout(scrollToTop, 0);
  }
}, [mode, submitStatus, locationCoords]); // Add all states that change "pages"

// Also add a specific one for after form submission success
useEffect(() => {
  if (submitStatus === 'success' && !window.location.hash) {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Force scroll after React renders
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  }
}, [submitStatus]);

const handleSelectPharmacy = async (pharmacy: SearchSuggestion) => {
  setSubmitStatus('idle');
  
  // Check if this is the manual entry option
  if (pharmacy.osm_id === 'manual_entry') {
    setShowManualEntry(true);
    setSearchTerm('');
    setResults([]);
    return;
  }
  
  const response = await fetch('/api/pharmacy-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pharmacy_id: pharmacy.osm_id })
});

if (!response.ok) {
  return;
}

const data = await response.json();

if (data.features[0].properties.manual) {
  setShowManualEntry(true);
  return;
}

const feature = data.features[0];

const street = feature.properties.address || '';
const city = feature.properties.context.place?.name || '';
const postcode = feature.properties.context.postcode?.name || '';
const stateAbbr = feature.properties.context.region?.region_code?.replace('US-', '') || '';
const phone = feature.properties.phone || '';
const [longitude, latitude] = feature.geometry.coordinates;

// Convert state abbreviation to full name
const stateName = STATE_ABBR_TO_NAME[stateAbbr.toUpperCase()] || stateAbbr;

setSelectedPharmacy({
  osm_id: pharmacy.osm_id,
  name: pharmacy.name,
  full_address: pharmacy.full_address,
  street_address: street,
  city: city,
  state: stateName,
  zip_code: postcode,
  latitude: latitude,
  longitude: longitude,
  phone_number: phone,
});

setSearchTerm('');
setResults([]);


};

// Add handler for manual pharmacy submission
// Update handler for manual pharmacy submission
const handleManualPharmacySubmit = async (
  pharmacyData: SelectedPharmacy,
  reportType: 'success' | 'denial',
  formulations: string[],
  standardizedNotes: string[],
  notes: string,
  turnstileToken: string
) => {
  const response = await fetch('/api/submit-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pharmacy: pharmacyData,
      reportType,
      formulations,
      standardizedNotes: standardizedNotes.map(key => getStandardizedNoteLabel(key)),
      notes,
      turnstileToken, // Ensure Turnstile token is included
    }),
  });

  if (response.ok) {
    setSelectedPharmacy(pharmacyData);
    setShowManualEntry(false);
    setSubmitStatus('success');

    const stateName = getStateFromZipCode(zipCode);
    analytics.trackEvent('report-submitted', stateName);

    // Refresh pharmacy data
    if (locationCoords) {
      const [lat, lon] = locationCoords;
      const refreshResponse = await fetch(`/api/pharmacies?lat=${lat}&lon=${lon}&t=${Date.now()}`);
      const refreshedData: Report[] = await refreshResponse.json();
      setAllReports(refreshedData);
    }
  } else {
    const errorData = await response.json();
    console.error('Manual Pharmacy Submission Error:', errorData);
  }
};

  // --- Reset error if user changes key form fields ---
  useEffect(() => {
    if (submitStatus === 'error') {
      setSubmitStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, consentMap, selectedStandardizedNotes, formulations, notes, selectedPharmacy]);

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
      } finally {
        setIsLoadingPharmacies(false);
      }
    };
    fetchAllReports();
  }
}, [mode, locationCoords]);


  // --- Aggregate reports by pharmacy ---
// Enhanced aggregation logic for page.tsx
// Replace the existing aggregation useEffect with this enhanced version

useEffect(() => {
  if (allReports.length === 0 && !isLoadingPharmacies) {
    setAggregatedPharmacies({});
    return;
  }
  
  const summary: Record<string, AggregatedPharmacy> = {};
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  interface TimestampedNote {
    note: string;
    timestamp: string;
    reportType: 'success' | 'denial';
  }
  
  const pharmacyNotesWithTime: Record<string, TimestampedNote[]> = {};
  
  for (const report of allReports) {
    if (!summary[report.pharmacyId]) {
      // Create the full address string
      const fullAddress = `${report.streetAddress}, ${report.city}, ${report.state} ${report.zipCode}`;
      
      summary[report.pharmacyId] = {
        id: report.pharmacyId,  // Use 'id' not 'pharmacyId'
        name: report.pharmacyName,  // Use 'name' not 'pharmacyName'
        coords: [report.latitude, report.longitude],
        status: 'denial',
        successCount: 0,
        denialCount: 0,
        lastUpdated: report.submissionTime,
        full_address: fullAddress,  // Use 'full_address' not separate fields
        phone_number: report.phoneNumber,  // Use 'phone_number' not 'phoneNumber'
        city: report.city,  // Add city
        state: report.state,  // Add state
        zip: parseInt(report.zipCode, 10),  // Add zip as number
        standardizedNotes: [],
        trend: 'neutral',
      };
      pharmacyNotesWithTime[report.pharmacyId] = [];
    }
    
    // Track counts
    if (report.reportType === 'success') {
      summary[report.pharmacyId].successCount++;
      // Update last updated time for successful reports
      if (new Date(report.submissionTime) > new Date(summary[report.pharmacyId].lastUpdated)) {
        summary[report.pharmacyId].lastUpdated = report.submissionTime;
      }
    } else {
      summary[report.pharmacyId].denialCount++;
    }
    
    // Collect notes with timestamps
    if (report.standardizedNotes) {
      report.standardizedNotes.forEach(note => {
        pharmacyNotesWithTime[report.pharmacyId].push({
          note,
          timestamp: report.submissionTime,
          reportType: report.reportType
        });
      });
    }
  }
  
  // Process each pharmacy's notes
  for (const pharmacyId in summary) {
    const pharmacy = summary[pharmacyId];
    const notesWithTime = pharmacyNotesWithTime[pharmacyId] || [];
    
    // Determine status
    if (pharmacy.successCount > pharmacy.denialCount) {
      pharmacy.status = 'success';
    } else if (pharmacy.denialCount > pharmacy.successCount) {
      pharmacy.status = 'denial';
    }
    
    // Calculate trend
    const recentSuccesses = allReports.filter(
      r => r.pharmacyId === pharmacyId &&
           r.reportType === 'success' &&
           new Date(r.submissionTime) > sevenDaysAgo
    ).length;
    
    const recentDenials = allReports.filter(
      r => r.pharmacyId === pharmacyId &&
           r.reportType === 'denial' &&
           new Date(r.submissionTime) > sevenDaysAgo
    ).length;
    
    if (recentSuccesses > recentDenials) {
      pharmacy.trend = 'up';
    } else if (recentDenials > recentSuccesses) {
      pharmacy.trend = 'down';
    }
    
    // Keep your existing enhanced note processing logic here...
    const processedNotes = new Map<string, string>();
    
    // Sort notes by timestamp (most recent first)
    notesWithTime.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Your existing stock status logic...
    const stockOutReport = notesWithTime.find(n => 
      n.note === 'Will order, but not in stock'
    );
    const stockInReport = notesWithTime.find(n => 
      n.reportType === 'success' && 
      new Date(n.timestamp) > (stockOutReport ? new Date(stockOutReport.timestamp) : new Date(0))
    );
    
    if (stockOutReport) {
      const daysAgo = Math.floor((now.getTime() - new Date(stockOutReport.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      if (stockInReport) {
        const stockInDaysAgo = Math.floor((now.getTime() - new Date(stockInReport.timestamp).getTime()) / (1000 * 60 * 60 * 24));
        processedNotes.set('stock', `✅ In stock (${stockInDaysAgo} days ago) • Previously out (${daysAgo} days ago)`);
      } else {
        if (daysAgo === 0) {
          processedNotes.set('stock', `⚠️ Out of stock (today)`);
        } else if (daysAgo === 1) {
          processedNotes.set('stock', `⚠️ Out of stock (yesterday)`);
        } else if (daysAgo <= 7) {
          processedNotes.set('stock', `⚠️ Out of stock (${daysAgo} days ago)`);
        } else {
          processedNotes.set('stock', `⚠️ Out of stock (${Math.floor(daysAgo / 7)} weeks ago)`);
        }
      }
    }
    
    // Process other notes
    const seenNotes = new Set<string>();
    for (const noteData of notesWithTime) {
      if (noteData.note !== 'Will order, but not in stock' && !seenNotes.has(noteData.note)) {
        seenNotes.add(noteData.note);
        const daysAgo = Math.floor((now.getTime() - new Date(noteData.timestamp).getTime()) / (1000 * 60 * 60 * 24));
        
        const timeSensitiveNotes = ['Long wait times', 'Best to call ahead'];
        if (timeSensitiveNotes.includes(noteData.note) && daysAgo > 0) {
          processedNotes.set(noteData.note, `${noteData.note} (${daysAgo} days ago)`);
        } else {
          processedNotes.set(noteData.note, noteData.note);
        }
      }
    }
    
    summary[pharmacyId].standardizedNotes = Array.from(processedNotes.values());
  }
  
  setAggregatedPharmacies(summary);
}, [allReports, isLoadingPharmacies]);

  // --- OSM ZIP code submit with client-side rate limiting and server-side API ---
const handleZipCodeSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoadingLocation(true);
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
      const response = await fetch(`/api/zip?zipCode=${zipCode}`);
      if (!response.ok) {
        return;  // Silently ignore all error cases
      }

  const data = await response.json();
  if (data.features && data.features.length > 0) {
    const [lon, lat] = data.features[0].center;
    setLocationCoords([lat, lon]);
  }
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
    return;
  }
  const timer = setTimeout(() => {
const fetchPharmacies = async () => {
  const [lat, lon] = locationCoords;
  const endpoint = `/api/pharmacy-search?q=${encodeURIComponent(searchTerm)}&lat=${lat}&lon=${lon}`;
  setIsSearching(true);  // ADD THIS
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    setResults(data.suggestions || []);
  } finally {
    setIsSearching(false);  // ADD THIS
  }
};
    fetchPharmacies();
  }, 500); // Slightly longer delay to be respectful
  return () => clearTimeout(timer);
}, [searchTerm, locationCoords, sessionToken, zipCode]); // Add zipCode to dependencies

  // --- Form helpers ---
  const handleFormulationChange = (option: string) => {
    setFormulations(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]);
  };


  // --- Report submit ---
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitStatus('idle');
  console.log('handleSubmit called');

  const sanitizedNotes = sanitize(notes);

  // Map standardized note keys to their labels
  const mappedStandardizedNotes = selectedStandardizedNotes.map(key => getStandardizedNoteLabel(key));

  // Debugging log
  console.log('Submitting standardized notes:', mappedStandardizedNotes);

  const reportData = {
    pharmacy: selectedPharmacy,
    reportType,
    formulations,
    standardizedNotes: mappedStandardizedNotes, // Use mapped labels
    notes: sanitizedNotes,
    turnstileToken,
  };

  const response = await fetch('/api/submit-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });

  if (response.ok) {
    // Reset Turnstile
    if (turnstile && typeof turnstile.reset === 'function') {
      turnstile.reset();
      setTurnstileToken(null);
    }

    // Refresh pharmacy data to show the new submission
    if (locationCoords) {
      const [lat, lon] = locationCoords;
      const refreshResponse = await fetch(`/api/pharmacies?lat=${lat}&lon=${lon}&t=${Date.now()}`);
      const refreshedData: Report[] = await refreshResponse.json();
      setAllReports(refreshedData);
    }

    setSubmitStatus('success');
  } else {
    // Reset Turnstile on failure to get a fresh token
    if (turnstile && typeof turnstile.reset === 'function') {
      turnstile.reset();
      setTurnstileToken(null);
    }
    setSubmitStatus('error');
  }

  setIsSubmitting(false);
};


const SHARE_MESSAGE = "Need to find bupe? Know a pharmacies bupe availability? Help map access in our community:";
const SHARE_URL = " https://findbupe.org"
  // --- Sharing helper ---
const handleShare = () => {
  const shareText = SHARE_MESSAGE + SHARE_URL;
  navigator.clipboard.writeText(shareText).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
};

  // --- Form validation for submit button ---
const canSubmit = !!(reportType && consentMap && turnstileToken && !isSubmitting && selectedPharmacy);  
  const handleFilterClick = (days: number | null) => {
    if (dateFilter === days) {
      setDateFilter(null);
    } else {
      setDateFilter(days);
    }
  };

  if (!locationCoords) {
    return (
      <ErrorBoundary>
      <div className={styles.zipCodeContainer}>
        <form onSubmit={handleZipCodeSubmit}>
          <h2><T>Enter Your ZIP Code</T></h2>
          <p style={{ color: 'var(--font-color-dark)', fontStyle: 'italic' }}>
          <T>Please enter a ZIP code to find and report pharmacies with bupe near you.</T> 
          </p>
          <div className={styles.formGroup}>
            <label htmlFor="zip-code"><T>ZIP Code</T></label>
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
          <button type="submit" className={styles.choiceButton} disabled={isLoadingLocation}>{isLoadingLocation ? <T>Loading...</T> : <T>Set Location</T>}</button>
          {locationError && <p className={styles.errorText}>{locationError}</p>}
        </form>
      </div>
      </ErrorBoundary>
    );
  }

  if (!mode) {
    return (
      <div className={styles.choiceContainer}>
        <h2><T>What would you like to do today?</T></h2>
        <div className={styles.choiceButtons}>
          <button className={styles.choiceButton} onClick={() => {setMode('report'); analytics.trackEvent('report-pharmacy-click');}}>
            <T>Update a Pharmacy&apos;s Bupe Status</T>
            </button>
          <button className={styles.choiceButton} onClick={() => {setMode('find'); analytics.trackEvent('find-pharmacy-click');}}>
            <T>Find a Bupe-Friendly Pharmacy</T>
            </button>
        </div>
        <SponsorLogo zipCode={zipCode} />
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
           <div className={styles.manualEntry}>
              <Link 
              href="/" 
              className={styles.backToZipLink}
                  onClick={(e) => {
                  e.preventDefault(); // Prevent default link behavior
                  // Reset all relevant state
                  setMode(null);
                  setLocationCoords(null);
                  setZipCode("");
                  setSearchTerm("");
                  setResults([]);
                  setSelectedPharmacy(null);
                  // If using router, you could also use:
                  // router.push('/');
                }}
              >
                <T> ← Back to ZIP </T>
              </Link>
            </div>
            <br />
            <div className={styles.findHeader}>
              <h2><T>Bupe-Friendly Pharmacies</T></h2>
              <button onClick={() => window.print()} className={styles.printButton}>
                 <T>Print List 🖨️</T>
                  </button>
            </div>
            <div className={styles.trendLegend}>
              <p><T>Trending Recently:</T></p>
              <div><TrendIndicator trend="up" /> <span><T>More Successes</T></span></div>
              <div><TrendIndicator trend="neutral" /> <span><T>Neutral</T></span></div>
              <div><TrendIndicator trend="down" /> <span><T>More Denials</T></span></div>
            </div>
              <div className={styles.privacyGuidanceSection}>
                <a 
                  href="/privacy#protect-yourself" 
                  className={styles.privacyButton}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <T>🔒 Privacy & Safety Tips 🔒</T>
                </a>
              </div>
            <div className={styles.filterGroup}>
              <button onClick={() => handleFilterClick(7)} className={`${styles.filterButton} ${dateFilter === 7 ? styles.active : ''}`}><T>Last 7 Days</T></button>
              <button onClick={() => handleFilterClick(15)} className={`${styles.filterButton} ${dateFilter === 15 ? styles.active : ''}`}><T>Last 15 Days</T></button>
              <button onClick={() => handleFilterClick(30)} className={`${styles.filterButton} ${dateFilter === 30 ? styles.active : ''}`}><T>Last 30 Days</T></button>
              <button onClick={() => handleFilterClick(null)} className={`${styles.filterButton} ${styles.allTimeButton} ${dateFilter === null ? styles.active : ''}`}><T>All Time</T></button>
            </div>
            {/* This is the printable content container */}
              <div className={styles.printableContent}>
                <div className={styles.pharmacyList}>
                  {isLoadingPharmacies ? (
                    <p><T>Loading pharmacies...</T></p>
                  ) : successfulPharmacies.length > 0 ? (
                    <>
                      <div className={styles.pharmacyList}>
                        {successfulPharmacies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(pharmacy => (
                          <PharmacyListItem key={pharmacy.id} pharmacy={pharmacy} />
                        ))}
                      </div>
                       <div className={styles.pagination}>
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className={styles.submitButton}
                        >
                          <T>← Previous Page</T>
                        </button>
                        <span className={styles.paginationText}>
                          {`Page ${currentPage} of ${Math.ceil(successfulPharmacies.length / itemsPerPage)}`}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage >= Math.ceil(successfulPharmacies.length / itemsPerPage)}
                          className={styles.submitButton}
                        >
                          <T>Next Page →</T>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.noReports}>
                      <p><T>No reports in your area. Be the first!</T></p>
                      <button
                        onClick={() => setMode('report')}
                        className={styles.submitButton}
                      >
                        <T>Report a Pharmacy</T>
                      </button>
                    </div>
                  )}
              </div>
              <div className={styles.printFooter}>
                <p><T>For the latest updates, visit findbupe.org</T></p>
              </div>
            </div>
          </>
        )}
        {mode === 'report' && (
          <>
            {submitStatus === 'success' ? (
              <div className={styles.successMessage}>
                <h3><T>🎉 Thank You! 🎉</T></h3>
                <p>
                <T>We know filling a bupe script isn&apos;t always easy. Your answers help others in your area find this lifesaving medication.</T></p>
                <br/>
                <p>
                <T>The most helpful info is NEW info!</T>
                </p> 
                <p>
                <T>So, the next time you try to fill a bupe script, tell us how it went. You can also help by sharing this website with friends who take bupe.</T>
                </p>
                <br/>
                <p style={{marginTop: '1.5rem', fontStyle: 'italic', fontSize: '0.9rem'}}><Link href="/privacy#protect-yourself" className={styles.styledLink}>
                <T>Remember to clear your browser history. Learn more in our privacy tips.🔒</T>
                </Link></p>
                <br/>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => {
                    setMode('find');
                    setSubmitStatus('idle');
                  }}
                >
                 <T> Find Bupe-Friendly Pharmacies Near You</T>
                </button>
                <button type="button" className={styles.submitButton} onClick={handleShare}>{copied ? <T>Copied to Clipboard!</T> : <T>Share with a Friend 🚀</T>}</button>
                <p style={{marginTop: '1.5rem', fontStyle: 'italic', fontSize: '0.9rem'}}><Link href="/bulk-upload" className={styles.styledLink}>
               <T>If you&apos;re interested in submitting multiple reports, check out our bulk reporting tool.</T>
                </Link></p>
              </div>
) : (
              <form onSubmit={handleSubmit}>
                <h2><T>Update Pharmacy&apos;s Bupe Status</T></h2>
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
                          <label htmlFor="pharmacy-search"><T>Search for a Pharmacy</T></label>
                          <input
                            type="text"
                            id="pharmacy-search"
                            placeholder="e.g., CVS"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                              e.preventDefault();
                              }
                            }}
                          />
                            {isSearching && <p>Searching...</p>}
                        </div>
                          <div className={styles.resultsList}>
                            {results.filter(r => r.osm_id !== 'manual_entry').map((result) => (
                              <button
                                key={result.osm_id}
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
                             <T> ➕ Can&apos;t find your pharmacy? Add it manually</T>
                            </button>
                          )}
                      </>
                    ) : (
                      <>
                        <div className={styles.selectedPharmacy}>
                          <p><strong>{selectedPharmacy.name}</strong><br />{selectedPharmacy.full_address}</p>
                          <button type="button" onClick={() => setSelectedPharmacy(null)}>
                            <T>Change pharmacy</T>
                            </button>
                        </div>
                        <div className={styles.formGroup}>
                          <label><T>What was the outcome? (Required)</T></label>
                          <hr className={styles.formDivider} />
                          <div className={styles.radioGroup}>
                            <label>
                              <input
                                type="radio"
                                name="reportType"
                                value="success"
                                checked={reportType === 'success'}
                                onChange={(e) => setReportType(e.target.value as 'success' | 'denial')}
                              />
                            <T>✅ I was able to fill my prescription</T>
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="reportType"
                                value="denial"
                                checked={reportType === 'denial'}
                                onChange={(e) => setReportType(e.target.value as 'success' | 'denial')}
                              /> 
                            <T>❌ I was not able to fill my prescription</T>
                            </label>
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label><T>Formulation (optional, check all that apply)</T></label>
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
                            <label><T>Common Observations (optional)</T></label>
                            <div className={styles.checkboxGroup}>
                              {standardizedNoteKeys.map(key => (
                                <label key={key} className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    value={key}
                                    checked={selectedStandardizedNotes.includes(key)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStandardizedNotes([...selectedStandardizedNotes, key]);
                                      } else {
                                        setSelectedStandardizedNotes(
                                          selectedStandardizedNotes.filter(k => k !== key)
                                        );
                                      }
                                    }}
                                  />
                                  <T id={`form.note.${key}`}>{getStandardizedNoteLabel(key)}</T>
                                </label>
                              ))}
                            </div>
                          </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="notes"><T>Other Notes (optional)</T></label>
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
                           <T> I understand my anonymous report will be used to update the public map (REQUIRED).</T>
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
                          {isSubmitting ? <T>Submitting...</T> : <T>Submit Report</T>}
                        </button>
                        {submitStatus === 'error' && (
                          <p className={styles.errorText}><T>Submission failed. Please try again.</T></p>
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