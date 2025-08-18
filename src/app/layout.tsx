// src/app/layout.tsx - COMPLETE FIXED FILE
import type { Metadata } from "next";
import Link from 'next/link';
import { Raleway, Merriweather } from 'next/font/google';
import styles from "./Layout.module.css";
import PrivacyBanner from './components/PrivacyBanner'; // ADD THIS IMPORT
import "./globals.css";

// Initialize both fonts and assign them to CSS variables
const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-merriweather',
});

// Single metadata declaration with PWA support
export const metadata: Metadata = {
  title: "Pharmacy Bupe Access Tool",
  description: "Crowd-sourced bupe access",
  manifest: "/manifest.json",
  themeColor: "#4A5D23",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};


export const viewport = {
  themeColor: '#001c3a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${raleway.variable} ${merriweather.variable}`}>
      <body>
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
            <p>This is a crowd-source resource. This tool is not a guarantee of service.</p>
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
              <Link href="https://news.opioidpolicy.org/#/portal" className={styles.styledLink}>
                Join Our Newsletter
              </Link>
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