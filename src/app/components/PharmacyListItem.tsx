// src/app/components/PharmacyListItem.tsx
"use client";

import { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const opera = (window as { opera?: unknown }).opera;
    const userAgent = navigator.userAgent || navigator.vendor || opera;
    setIsMobile(/android|iphone|ipad|ipod/i.test(String(userAgent)));
  }, []);

  const mapLink = isMobile
    ? `geo:${latitude},${longitude}?q=${encodeURIComponent(pharmacy.name)}`
    : `https://www.openstreetmap.org/directions?to=${latitude}%2C${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className={styles.listItem}>
      <div className={styles.listItemInfo}>
        <strong>
          {pharmacy.name}
          <TrendIndicator trend={pharmacy.trend} />
        </strong>
        {/* UPDATED: The address is now a clickable link */}
        <a href={mapLink} target="_blank" rel="noopener noreferrer" className={styles.styledLink}>
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
          href={mapLink} 
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