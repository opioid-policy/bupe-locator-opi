// src/app/components/PrivacyBanner.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './PrivacyBanner.module.css';

export default function PrivacyBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [hasTrackers, setHasTrackers] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed (using sessionStorage, not cookies)
    const dismissed = sessionStorage.getItem('privacyBannerDismissed');
    if (!dismissed) {
      setShowBanner(true);
    }

    // Browser detection for Google/Facebook
    // This checks if the user might be logged into tracking services
    // It doesn't use cookies but checks for common tracking indicators
    const checkForTrackers = () => {
      // Check if common tracking scripts are blocked (privacy browser indicator)
      const privacyIndicators = [
        // Check if third-party cookies are blocked
        !navigator.cookieEnabled,
        // Check for Do Not Track
        navigator.doNotTrack === "1",
        // Check for common privacy browser user agents
        /Tor|Brave/i.test(navigator.userAgent)
      ];

      // If none of the privacy indicators are present, user might be tracked
      const mightBeTracked = !privacyIndicators.some(indicator => indicator);
      setHasTrackers(mightBeTracked);
    };

    checkForTrackers();
  }, []);

  const dismissBanner = () => {
    sessionStorage.setItem('privacyBannerDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className={styles.privacyBanner}>
      <div className={styles.content}>
        <p>
          🔒 <strong>Privacy Tip:</strong> 
          {hasTrackers ? (
            <> For maximum privacy, consider using incognito/private browsing mode or a privacy-focused browser like Brave or Tor. </>
          ) : (
            <> Good job using privacy protections! Remember to clear your history when done. </>
          )}
          <Link href="/privacy" className={styles.learnMore}> Learn more</Link>
        </p>
        <button onClick={dismissBanner} className={styles.dismissButton} aria-label="Dismiss privacy banner">
          ✕
        </button>
      </div>
    </div>
  );

  useEffect(() => {
  // Check if DNT is enabled
  const dntEnabled = navigator.doNotTrack === "1" || 
                     window.doNotTrack === "1" || 
                     navigator.msDoNotTrack === "1";
  
  if (dntEnabled) {
    // Show a small notice that DNT is respected
    console.log('Your Do Not Track preference is respected');
  }
}, []);
}



