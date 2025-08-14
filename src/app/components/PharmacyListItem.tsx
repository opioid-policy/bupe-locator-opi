"use client";
import { useState, useEffect } from 'react';
import styles from '../Home.module.css';
import { AggregatedPharmacy } from '../page';
import TrendIndicator from './TrendIndicator';
import { getDirectionsUrl } from '../lib/directions';

interface PharmacyListItemProps {
  pharmacy: AggregatedPharmacy;
}

function formatDate(dateString: string) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PharmacyListItem({ pharmacy }: PharmacyListItemProps) {
  // Destructure coordinates directly from pharmacy.coords
  const [latitude, longitude] = pharmacy.coords || [0, 0];
  const [directionsUrl, setDirectionsUrl] = useState<string>("");
  const [mapUrl, setMapUrl] = useState<string>("");

  useEffect(() => {
    // Generate both directions and map view URLs
    if (latitude && longitude) {
      setDirectionsUrl(getDirectionsUrl(latitude, longitude));
      setMapUrl(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`);
    }
  }, [latitude, longitude]);

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemInfo}>
        <strong>
          {pharmacy.name}
          <TrendIndicator trend={pharmacy.trend} />
        </strong>

        {/* Use mapUrl for the address link instead of directionsUrl */}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.styledLink}
        >
          <small>{pharmacy.full_address}</small>
        </a>

        {/* Phone number section - keep as is */}
        {pharmacy.phone_number && (
          <div className={styles.phoneNumber}>
            <small>Phone: {pharmacy.phone_number}</small>
          </div>
        )}

        {/* Reports section - keep as is */}
        <div className={styles.reportSection}>
          <br className={styles.reportBreak} />
          <small>Success Reports: {pharmacy.successCount}</small>
          <br />
          <small>Denial Reports: {pharmacy.denialCount}</small>
        </div>

        {pharmacy.lastUpdated && (
          <small className={styles.lastUpdated}>
            <br className={styles.reportBreak} />
            Last Successful Report: {formatDate(pharmacy.lastUpdated)}
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
          <a
            href={`tel:${pharmacy.phone_number.replace(/\D/g, '')}`}
            className={styles.callButton}
          >
            Call Pharmacy
          </a>
        )}

        {/* Only show directions button if we have valid coordinates */}
        {latitude && longitude && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsButton}
          >
            Get Directions
          </a>
        )}
      </div>
    </div>
  );
}
