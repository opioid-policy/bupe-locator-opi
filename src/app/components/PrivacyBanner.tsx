"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './PrivacyBanner.module.css';

declare global {
  interface Window {
    doNotTrack?: string;
  }
  interface Navigator {
    msDoNotTrack?: string; // <-- Add this line
  }
}

export default function PrivacyBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [hasTrackers, setHasTrackers] = useState(false);
  const [dntEnabled, setDntEnabled] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('privacyBannerDismissed');
    if (!dismissed) {
      setShowBanner(true);
    }

    // No `any` needed here now
    const isDNTEnabled = navigator.doNotTrack === "1" ||
                        window.doNotTrack === "1" ||
                        navigator.msDoNotTrack === "1";

    setDntEnabled(isDNTEnabled);

    const checkForTrackers = () => {
      const privacyIndicators = [
        !navigator.cookieEnabled,
        isDNTEnabled,
        /Tor|Brave/i.test(navigator.userAgent)
      ];
      const mightBeTracked = !privacyIndicators.some(indicator => indicator);
      setHasTrackers(mightBeTracked);
    };

    checkForTrackers();

    if (isDNTEnabled && process.env.NODE_ENV === 'development') {
      console.log('Do Not Track is enabled - your privacy preference is respected');
    }
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
          {dntEnabled ? (
            <> Do Not Track detected - we respect your privacy preference. </>
          ) : hasTrackers ? (
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
}
