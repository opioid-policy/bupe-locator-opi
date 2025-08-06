// src/app/components/PharmacyListItem.tsx
"use client";

import styles from '../Home.module.css';
import { AggregatedPharmacy } from '../page';
import TrendIndicator from './TrendIndicator';

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
  const mapLink = `https://www.openstreetmap.org/directions?to=${latitude}%2C${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemInfo}>
        <strong>
          {pharmacy.name}
          <TrendIndicator trend={pharmacy.trend} />
        </strong>
        <small>{pharmacy.full_address}</small> 
        {/* NEW: Add the phone number here for printing */}
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
        <a href={mapLink} target="_blank" rel="noopener noreferrer" className={styles.directionsButton}>Get Directions</a>
      </div>
    </div>
  );
}