// src/components/LanguageSelector.tsx - Mobile-friendly floating selector
"use client";
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from '@/lib/i18n-client';
import { languages, Language } from '@/lib/i18n';
import styles from './LanguageSelector.module.css';
import { analytics } from '@/lib/privacy-analytics';


export default function LanguageSelector() {
  const { currentLang, changeLang, isLoading } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Close selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Prevent body scroll when selector is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

const handleLanguageChange = async (newLang: Language) => {
  setIsOpen(false);
  if (newLang !== currentLang) {
    await changeLang(newLang);
    analytics.trackEvent('language-switched');
    // Add this line to force reload:
    window.location.reload();
  }
};

  const currentLanguage = languages.find(l => l.code === currentLang);

  // Split languages into two columns for better mobile UX
  const leftColumn = languages.slice(0, 8);
  const rightColumn = languages.slice(8);

  return (
    <div className={styles.languageSelector} ref={selectorRef}>
      {/* Floating Globe Button */}
      <button
        className={styles.globeButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className={styles.loading}>⟳</span>
        ) : (
          <>
            <span className={styles.globe}>🌎</span>
            <span className={styles.currentLang}>{currentLanguage?.code.toUpperCase()}</span>
          </>
        )}
      </button>

      {/* Language Selection Overlay */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          
          {/* Language grid */}
          <div className={styles.languageGrid}>
            <div className={styles.gridHeader}>
              <h3>Select Language</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close language selector"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.languageColumns}>
              {/* Left Column */}
              <div className={styles.languageColumn}>
                {leftColumn.map((lang) => (
                  <button
                    key={lang.code}
                    className={`${styles.languageOption} ${
                      currentLang === lang.code ? styles.active : ''
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isLoading}
                    aria-label={`Switch to ${lang.name}`}
                  >
                    <span className={styles.languageName}>
                      {lang.nativeName}
                    </span>
                    {currentLang === lang.code && (
                      <span className={styles.checkmark} aria-hidden="true">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Right Column */}
              <div className={styles.languageColumn}>
                {rightColumn.map((lang) => (
                  <button
                    key={lang.code}
                    className={`${styles.languageOption} ${
                      currentLang === lang.code ? styles.active : ''
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isLoading}
                    aria-label={`Switch to ${lang.name}`}
                  >
                    <span className={styles.languageName}>
                      {lang.nativeName}
                    </span>
                    {currentLang === lang.code && (
                      <span className={styles.checkmark} aria-hidden="true">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}