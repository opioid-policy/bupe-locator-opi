"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './PrivacyBanner.module.css';
import { T, NoTranslate } from '@/lib/i18n-markers';


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
          🕵️ <strong>Privacy Tip:</strong>
          {dntEnabled ? (
            <><T> Do Not Track detected - we respect your privacy preference.</T> </>
          ) : hasTrackers ? (
           <><T> For maximum privacy, consider clearing your browser history and switching to incognito/private browsing mode or a privacy-focused browser like Brave or Tor.</T> </>
          ) : (
            <><T> Nice privacy protections! Remember to clear your history when done.</T> </>
          )}
          <Link href="/privacy#protect-yourself" className={styles.learnMore}> <T>Learn more</T></Link>
        </p>
        <button onClick={dismissBanner} className={styles.dismissButton} aria-label="Dismiss privacy banner">
          ✕
        </button>
      </div>
    </div>
  );
}
