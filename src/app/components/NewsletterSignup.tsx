// src/app/components/NewsletterSignup.tsx
"use client";

import { useState, useEffect } from 'react'; // Add useRef
import styles from './NewsletterSignup.module.css';
import { T } from '@/lib/i18n-markers';


// Add global Turnstile callback
declare global {
  interface Window {
    onNewsletterTurnstileSuccess2: (token: string) => void;
    turnstile?: {
      reset: (widgetId?: string) => void;
      execute: (widgetId?: string) => void; // Add this line
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;     };
  }
}

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


  // Set up Turnstile callback
useEffect(() => {
  window.onNewsletterTurnstileSuccess2 = (token: string) => {
    setTurnstileToken(token);
    // Auto-submit if all conditions are met
    if (email && consent && !isSubmitting) {
      // The form will auto-submit since canSubmit will now be true
    }
  };

  // Load Turnstile script if not already loaded (this is safe - Turnstile handles multiple loads)
  if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.head.appendChild(script);
  }
}, [email, consent, isSubmitting]); // Add dependencies

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!email || !consent || isSubmitting) return;

  // Wait for Turnstile token with invisible widget
  if (!turnstileToken) {
    setIsSubmitting(true);
    setStatus('idle');
    
    // Manually trigger Turnstile execution if available
    if (window.turnstile) {
      try {
        window.turnstile.execute();
      } catch (error) {
        console.error('Turnstile execute error:', error);
      }
    }
    
    // Wait for token with longer timeout for invisible widget
    const checkToken = setInterval(() => {
      if (turnstileToken) {
        clearInterval(checkToken);
        // Token received, retry submit
        handleSubmit(e);
      }
    }, 100);
    
    // Safety timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkToken);
      if (!turnstileToken) {
        setIsSubmitting(false);
        setStatus('error');
        setMessage('Security check failed. Please refresh and try again.');
      }
    }, 5000);
    
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
        
        // Reset Turnstile
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
          window.turnstile.reset();
          setTurnstileToken(null);
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
  } catch (error) {
  console.error('Newsletter submission error:', error); // Add this line
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

        {/* Turnstile widget */}
        <div className={styles.turnstileContainer}>
        <div 
        className="cf-turnstile" 
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-callback="onNewsletterTurnstileSuccess2"
        data-theme="light"
        data-size="invisible"
        data-auto="true"
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