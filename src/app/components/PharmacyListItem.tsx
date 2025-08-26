"use client";
import { useState, useEffect, useMemo } from 'react';
import styles from '../Home.module.css';
import { AggregatedPharmacy } from '../page';
import TrendIndicator from './TrendIndicator';
// import { getDirectionsUrl } from '../lib/directions'; // <-- REMOVED this line
import ErrorBoundary from './ErrorBoundary';
import MapLoading from './MapLoading';

interface PharmacyListItemProps {
  pharmacy: AggregatedPharmacy;
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function formatDate(dateString: string): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function PharmacyListItem({ pharmacy }: PharmacyListItemProps) {
  const [latitude, longitude] = pharmacy.coords || [0, 0];
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera;
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent?.toLowerCase() || ''
    );
    setIsMobile(isMobileDevice);
  }, []);

  // --- UPDATED LOGIC ---
  // Memoized URL for native map applications (Mobile)
  const directionsUrl = useMemo(() => {
    if (!latitude || !longitude) return "";

    // Differentiate between iOS and other platforms to generate the correct map link.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: boolean }).MSStream;

    if (isIOS) {
      // Apple Maps URL scheme
      return `https://maps.apple.com/?daddr=${latitude},${longitude}`;
    } else {
      // Google Maps URL scheme for Android and others
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
  }, [latitude, longitude]);


  // Memoized URL for OpenStreetMap (Desktop)
  const osmUrl = useMemo(() => {
    if (!latitude || !longitude) return "";
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  }, [latitude, longitude]);

  const formattedDate = useMemo(() =>
    formatDate(pharmacy.lastUpdated),
    [pharmacy.lastUpdated]
  );

  const handleCallClick = () => {
    setIsCallLoading(true);
    setTimeout(() => {
      window.location.href = `tel:${pharmacy.phone_number.replace(/\D/g, '')}`;
      setIsCallLoading(false);
    }, 500);
  };

  // Opens the native map app on mobile devices
  const openMobileMaps = () => {
    setIsDirectionsLoading(true);
    setShowPrivacyWarning(false);
    setTimeout(() => {
      // This now uses the correctly generated native map URL
      window.location.href = directionsUrl;
      setIsDirectionsLoading(false);
    }, 100);
  };

  // Opens OpenStreetMap in a new tab for desktop users
  const openDesktopMaps = () => {
    setIsDirectionsLoading(true);
    setTimeout(() => {
      window.open(osmUrl, '_blank', 'noopener,noreferrer');
      setIsDirectionsLoading(false);
    }, 100);
  };

  // Main handler for the "Get Directions" button
  const handleDirectionsClick = () => {
    if (isMobile) {
      setShowPrivacyWarning(true);
    } else {
      openDesktopMaps();
    }
  };

  return (
    <ErrorBoundary fallback={
      <div className={styles.listItem} style={{ padding: '1rem', color: '#666' }}>
        Error loading pharmacy information
      </div>
    }>
      <div className={styles.listItem}>
        {/* ... rest of the JSX is unchanged ... */}
        <div className={styles.listItemInfo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong>{decodeHtmlEntities(pharmacy.name)}</strong>
            <TrendIndicator trend={pharmacy.trend} />
          </div>
          {pharmacy.full_address && (
            <div className={styles.addressContainer}>
              <a
                // This link remains for accessibility but the button is the primary interaction
                onClick={(e) => { e.preventDefault(); handleDirectionsClick(); }}
                href={directionsUrl}
                target="_self"
                rel="noopener noreferrer"
                className={styles.styledLink}
                aria-label={`View ${pharmacy.name} on map (opens in map app)`}
              >
                <small>{pharmacy.full_address} 🚌</small>
              </a>
            </div>
          )}
          {pharmacy.phone_number && (
            <div className={styles.phoneNumber}>
              <small>
                Phone:{" "}
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleCallClick();
                  }}
                  href={`tel:${pharmacy.phone_number.replace(/\D/g, '')}`}
                  aria-label={`Call ${pharmacy.name}`}
                  style={{ cursor: 'pointer' }}
                >
                  {pharmacy.phone_number} 📞
                </a>
              </small>
            </div>
          )}
          <div className={styles.reportSection}>
            <small>Success Reports: {pharmacy.successCount}</small>
            <br />
            <small>Denial Reports: {pharmacy.denialCount}</small>
          </div>
          {pharmacy.lastUpdated && formattedDate && (
            <small className={styles.lastUpdated}>
              <br className={styles.reportBreak} />
              Last Successful Report: {formattedDate}
            </small>
          )}
          {pharmacy.standardizedNotes && pharmacy.standardizedNotes.length > 0 && (
            <div className={styles.tagContainer}>
              {pharmacy.standardizedNotes.map(note => (
                <span key={note} className={styles.tag}>{note}</span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.listItemActions}>
          {pharmacy.phone_number && (
            <button
              onClick={handleCallClick}
              className={styles.callButton}
              disabled={isCallLoading}
              aria-label={`Call ${pharmacy.name}`}
            >
              {isCallLoading ? <MapLoading /> : 'Call Pharmacy 📞'}
            </button>
          )}
          {latitude && longitude && directionsUrl && (
            <>
              <button
                onClick={handleDirectionsClick}
                className={styles.directionsButton}
                disabled={isDirectionsLoading}
                aria-label={`Get directions to ${pharmacy.name}`}
              >
                {isDirectionsLoading ? <MapLoading /> : 'Get Directions 🚌'}
              </button>

              {showPrivacyWarning && (
                <div className={styles.privacyWarningOverlay}>
                  <div className={styles.privacyWarningContent}>
                    <h3>Privacy Notice</h3>
                    <p>
                      This will open your device&apos;s map application. Please be aware that:
                    </p>
                    <ul>
                      <li>Your map application may collect and share your location data</li>
                      <li>We don&apos;t track or store your location</li>
                      <li>Use privacy preserving mapping apps like Organic Maps</li>
                    </ul>
                    <div className={styles.privacyWarningButtons}>
                      <button
                        onClick={() => setShowPrivacyWarning(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={openMobileMaps}
                        className={styles.continueButton}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}