// src/app/components/Footer.tsx
import Link from 'next/link';
import NewsletterSignup from './NewsletterSignup';
import ErrorBoundary from './ErrorBoundary';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
          <ErrorBoundary 
            fallback={
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--font-color-light)',
                backgroundColor: 'var(--bg-color)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <p>Newsletter signup temporarily unavailable.</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  You can still contact us for updates using our{' '}
                  <Link href="https://opioidpolicy.fillout.com/contact-form" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-green)' }}>
                    contact form
                  </Link>.
                </p>
              </div>
            }
          >
            <NewsletterSignup />
          </ErrorBoundary>
        </div>

        {/* Footer Content */}
        <div className={styles.content}>
          <div className={styles.links}>
            <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
            <Link href="/about" className={styles.link}>About</Link>
            <Link href="/bulk-upload" className={styles.link}>Bulk Upload</Link>
            <Link href="https://opioidpolicy.fillout.com/contact-form" 
                  className={styles.link} 
                  target="_blank" 
                  rel="noopener noreferrer">
              Contact
            </Link>
          </div>
          <div className={styles.copyright}>
            <p>
              © {new Date().getFullYear()} Opioid Policy Institute. 
              Open source project to increase access to buprenorphine.
            </p>
            <p className={styles.privacy}>
              🔒 No tracking • No ads • Privacy-first design
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}