"use client";
import { useState, useMemo } from 'react';
import styles from '../Home.module.css';
import { AggregatedPharmacy } from '../page';
import TrendIndicator from './TrendIndicator';
import ErrorBoundary from './ErrorBoundary';
import MapLoading from './MapLoading';
import { T } from '@/lib/i18n-markers';
import { getStandardizedNoteLabel } from '@/lib/form-options';


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
  
  const [isMobile] = useState(() => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent?.toLowerCase() || ''
  );
});

  // --- UPDATED LOGIC ---
  // Memoized URL for native map applications (Mobile)
 const directionsUrl = useMemo(() => {
  if (!latitude || !longitude) return "";
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: boolean }).MSStream;
  const name = pharmacy.name ? encodeURIComponent(pharmacy.name) : '';

  if (isIOS) {
    return `https://maps.apple.com/?daddr=${latitude},${longitude}&q=${name}`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;
  }
}, [latitude, longitude, pharmacy.name]);


  // Memoized URL for OpenStreetMap (Desktop)
  const osmUrl = useMemo(() => {
    if (!latitude || !longitude) return "";
    
    // OpenStreetMap directions URL - user just needs to enter their starting point
    // The route parameter format is: from_lat,from_lon;to_lat,to_lon
    // We leave the "from" part empty so user can fill it in
    return `https://www.openstreetmap.org/directions?engine=osrm_car&route=;${latitude},${longitude}#map=13/${latitude}/${longitude}`;
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
  setShowPrivacyWarning(false);
  window.location.href = directionsUrl;
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
            <small>{pharmacy.full_address} 🚌</small>
            </div>
          )}
          {pharmacy.phone_number && (
            <div className={styles.phoneNumber}>
              <small>
                <T>Phone:</T>{" "}
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
           <small><T>Success Reports:</T>{pharmacy.successCount}</small>
            <br />
           <small><T>Denial Reports:</T>{pharmacy.denialCount}</small>
          </div>
          {pharmacy.lastUpdated && formattedDate && (
            <small className={styles.lastUpdated}>
              <br className={styles.reportBreak} />
              <T>Last Successful Report:</T> {formattedDate}
            </small>
          )}
            {pharmacy.standardizedNotes && pharmacy.standardizedNotes.length > 0 && (
              <div className={styles.tagContainer}>
                {pharmacy.standardizedNotes.map(note => {
                  const label = getStandardizedNoteLabel(note);
                  return (
                    <span key={note} className={styles.tag}>
                      <T id={`form.note.${note}`}>{label}</T>
                    </span>
                  );
                })}
              </div>
            )}
            {pharmacy.formulations && pharmacy.formulations.length > 0 && (
              <div className={styles.tagContainer} style={{ marginTop: '0.5rem' }}>
                {pharmacy.formulations.map((formulation, index) => (
                  <span key={`${formulation}-${index}`} className={styles.tag} style={{ 
                    backgroundColor: '#d4edda', 
                    color: '#155724',
                    borderLeft: '3px solid #28a745'
                  }}>
                    {formulation}
                  </span>
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
              {isCallLoading ? <MapLoading /> :<T>Call Pharmacy 📞</T>}
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
                {isDirectionsLoading ? <MapLoading /> : <T>Get Directions 🚌</T>}
              </button>

              {showPrivacyWarning && (
                <div className={styles.privacyWarningOverlay}>
                  <div className={styles.privacyWarningContent}>
                    <h3>Privacy Notice</h3>
                    <p>
                     <T>This will open your device&apos;s map application. Please be aware that:</T>
                    </p>
                    <ul>
                     <li><T>Your map application may collect and share your location data</T></li>
                     <li><T>We don&apos;t track or store your location</T></li>
                     <li><T>Use privacy preserving mapping apps like Organic Maps</T></li>
                    </ul>
                    <div className={styles.privacyWarningButtons}>
                      <button
                        onClick={() => setShowPrivacyWarning(false)}
                        className={styles.cancelButton}
                      >
                        <T>Cancel</T>
                      </button>
                      <button
                        onClick={openMobileMaps}
                        className={styles.continueButton}
                      >
                       <T>Continue</T>
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