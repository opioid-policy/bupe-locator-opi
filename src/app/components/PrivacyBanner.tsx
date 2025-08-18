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
}

// src/app/components/PrivacyBanner.module.css
/*
.privacyBanner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--accent-yellow);
  border-bottom: 2px solid var(--accent-green);
  padding: 0.75rem 1rem;
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.content p {
  margin: 0;
  flex: 1;
  color: var(--font-color-dark);
  font-size: 0.9rem;
}

.learnMore {
  color: var(--accent-green);
  text-decoration: underline;
}

.dismissButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--font-color-dark);
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.dismissButton:hover {
  opacity: 1;
}

@media (max-width: 640px) {
  .content {
    flex-direction: column;
    text-align: center;
  }
  
  .dismissButton {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
}
*/