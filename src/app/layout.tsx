// src/app/layout.tsx - COMPLETE FIXED FILE
"use client";

import Link from 'next/link';
import { Raleway, Merriweather } from 'next/font/google';
import styles from "./Layout.module.css";
import PrivacyBanner from './components/PrivacyBanner'; // ADD THIS IMPORT
import "./globals.css";
import ScrollToTop from './components/ScrollToTop';
import HashNavigator from './components/HashNavigator';


// Initialize both fonts and assign them to CSS variables
const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400','500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-merriweather',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${raleway.variable} ${merriweather.variable}`}>
    <body className={`${merriweather.variable} ${raleway.variable} ${styles.body}`}>
        <ScrollToTop />
        <HashNavigator />
        <PrivacyBanner /> {/* ADD THIS LINE - Banner at top of page */}
        <div className={styles.appContainer}>
          <header className={styles.header}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={styles.styledLink}>
              <h1>Bupe Access Tool</h1>
            </a>
          </header>
          <main className={styles.main}>
            {children}
          </main>
          <footer className={styles.footer}>
            <p>This is a crowd-source resource.</p>
            <p>We only have data on bupe availability that has been reported to this database.</p>
            <p>This tool is not a guarantee of service. This data is not comprehensive.</p>
             <p style={{marginTop: '0.5rem'}}>
                <a 
                  href="https://bupe.opioidpolicy.org" 
                  className={styles.styledLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Home
                </a>
              </p>           
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/about" className={styles.styledLink}>
                About This Project
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/dashboard" className={styles.styledLink}>
                Check Out Our Dashboard
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/methadone-naltrexone" className={styles.styledLink}>
                What About Other Treatments?
              </Link>
            </p>
             <p style={{marginTop: '0.5rem'}}>
              <Link href="/bulk-upload" className={styles.styledLink}>
                Bulk Reporting Tool
              </Link>
            </p>
              <p style={{marginTop: '0.5rem'}}>
                <a 
                  href="https://news.opioidpolicy.org/#/portal" 
                  className={styles.styledLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Our Newsletter
                </a>
              </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/privacy" className={styles.styledLink}>
                 🔒 Privacy Info & Tips 🔒
              </Link>
            </p>
            <a 
              href="https://buy.stripe.com/cN2g1p3jIdrw1W0cMM"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              Support Us <span>❤️</span>
            </a>
            <a href="https://opioidpolicy.org" target="_blank" rel="noopener noreferrer" className={styles.footerLogoLink}>
              <picture>
                <source srcSet="/opi-logo-square.png" media="(max-width: 767px)" />
                <img src="/opi-logo-long.png" alt="Opioid Policy Institute Logo" />
              </picture>
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}