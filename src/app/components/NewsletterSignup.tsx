// src/app/components/NewsletterSignup.tsx
"use client";

import { useState } from 'react';
import Turnstile from 'react-turnstile';
import styles from './NewsletterSignup.module.css';
import { T } from '@/lib/i18n-markers';

interface NewsletterSignupProps {
  className?: string;
}

export default function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !consent || isSubmitting) return;

    // Check if we have a turnstile token
    if (!turnstileToken) {
      setStatus('error');
      setMessage('Security check failed. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          turnstileToken,
          consent 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing! We\'ll send updates on organizing and policy changes.');
        setEmail('');
        setConsent(false);
        setTurnstileToken(null);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter submission error:', error);
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = email && consent && !isSubmitting;

  return (
    <div className={`${styles.newsletterContainer} ${className || ''}`}>
      <h3 className={styles.title}>
        <T>Subscribe to our newsletter for organizing and updates</T>
      </h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={isSubmitting}
            className={styles.emailInput}
            aria-label="Email address for newsletter signup"
          />
        </div>

        {/* Consent checkbox */}
        <div className={styles.consentContainer}>
          <label className={styles.consentLabel}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              disabled={isSubmitting}
              className={styles.consentCheckbox}
            />
            <span className={styles.consentText}>
              <T>I consent to receive optional newsletter updates from the Opioid Policy Institute.</T>
            </span>
          </label>
        </div>

        {/* Turnstile widget - matches your working ManualPharmacyEntry pattern */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={(token) => setTurnstileToken(token)}
            onError={() => {
              setStatus('error');
              setMessage('Security check failed. Please refresh and try again.');
            }}
            theme="light"
          />
        ) : (
          <div className={styles.errorMessage}>
            Security configuration error. Please contact support.
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={styles.submitButton}
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </button>

        {status !== 'idle' && (
          <div className={`${styles.message} ${styles[status]}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}