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
  const [latitude, longitude] = pharmacy.coords;
  const [directionsUrl, setDirectionsUrl] = useState<string>("");

  useEffect(() => {
    setDirectionsUrl(getDirectionsUrl(latitude, longitude, pharmacy.full_address || pharmacy.name));
    // eslint-disable-next-line
  }, [latitude, longitude, pharmacy.full_address, pharmacy.name]);

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemInfo}>
        <strong>
          {pharmacy.name}
          <TrendIndicator trend={pharmacy.trend} />
        </strong>
        {/* Address is now a clickable link */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.styledLink}
          style={{ textDecoration: "underline", cursor: "pointer" }}
        >
          <small>{pharmacy.full_address}</small>
        </a>
        {pharmacy.phone_number && (
          <small className={styles.printOnlyPhone}>{pharmacy.phone_number}</small>
        )}
        <small>&nbsp;</small> 
        <small>Success Reports: {pharmacy.successCount} / Denial Reports: {pharmacy.denialCount}</small>
        {pharmacy.lastUpdated && (<small className={styles.lastUpdated}>Last Successful Report: {formatDate(pharmacy.lastUpdated)}</small>)}
        {pharmacy.standardizedNotes && pharmacy.standardizedNotes.length > 0 && (
          <div className={styles.tagContainer}>
            {pharmacy.standardizedNotes.map(note => ( <span key={note} className={styles.tag}>{note}</span> ))}
          </div>
        )}
      </div>
      <div className={styles.listItemActions}>
        {pharmacy.phone_number && ( <a href={`tel:${pharmacy.phone_number}`} className={styles.callButton}>Call Pharmacy</a> )}
        <a 
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.directionsButton}
        >
          Get Directions
        </a>
      </div>
    </div>
  );
}