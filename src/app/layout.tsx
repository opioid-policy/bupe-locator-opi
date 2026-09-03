// src/app/layout.tsx
"use client";

import Link from 'next/link';
import localFont from 'next/font/local';
import styles from "./Layout.module.css";
import PrivacyBanner from './components/PrivacyBanner';
import LanguageSelector from './components/LanguageSelector';
import "./globals.css";
import ScrollToTop from './components/ScrollToTop';
import HashNavigator from './components/HashNavigator';
import { useTranslations } from '@/lib/i18n-client';
import { getTextDirection } from '@/lib/i18n';
import { useEffect } from 'react';
import { T } from '@/lib/i18n-markers';
import TranslationNotice from './components/TranslationNotice';
import SiteFooter from './components/SiteFooter';

// OPI 2026 fonts, self-hosted from src/fonts (no font CDN, no third-party requests).
const fraunces = localFont({
  src: [
    { path: '../fonts/fraunces-variable.woff2', weight: '100 900', style: 'normal' },
    { path: '../fonts/fraunces-variable-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const geist = localFont({
  src: [
    { path: '../fonts/geist-variable.woff2', weight: '100 900', style: 'normal' },
    { path: '../fonts/geist-variable-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: '../fonts/jetbrains-mono-variable.woff2',
  weight: '100 800',
  variable: '--font-mono',
  display: 'swap',
});

const CHROME_VERSION = process.env.NEXT_PUBLIC_CHROME_V ?? '0';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentLang } = useTranslations();

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = getTextDirection(currentLang);
  }, [currentLang]);

  return (
    <html
      lang={currentLang}
      dir={getTextDirection(currentLang)}
      suppressHydrationWarning
      className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body className={styles.body}>
        {/* Vendored OPI design-system CSS (inside @layer opi, so app styles win). */}
        <link rel="stylesheet" href={`/opi/global.css?v=${CHROME_VERSION}`} precedence="low" />
        <ScrollToTop />
        <HashNavigator />
        <PrivacyBanner />
        <LanguageSelector />

        <div className={styles.appContainer}>
          <header className={styles.header}>
            <Link href="/" className={styles.brandLink}>
              <h1><T>Bupe Access Tool</T></h1>
            </Link>
          </header>
          <main className={styles.main}>
            {children}
          </main>

          {/* Tool-specific footer: disclaimers + pages that only exist on this site. */}
          <footer className={styles.toolFooter}>
            <p><T>This is a crowd-source resource.</T></p>
            <p><T>We only have data on bupe availability that has been reported to this database.</T></p>
            <p><T>This tool is not a guarantee of service. This data is not comprehensive.</T></p>
            <TranslationNotice />
            <nav className={styles.toolLinks} aria-label="Bupe Access Tool pages">
              <Link href="/demo" className={styles.styledLink}><T>How It Works</T></Link>
              <Link href="/about" className={styles.styledLink}><T>About</T></Link>
              <Link href="/dashboard" className={styles.styledLink}><T>Dashboard</T></Link>
              <Link href="/methadone-naltrexone" className={styles.styledLink}><T>What About Other Treatments?</T></Link>
              <Link href="/bulk-upload" className={styles.styledLink}><T>Bulk Reporting Tool</T></Link>
              <a
                href="https://news.opioidpolicy.org/tag/find-bupe/"
                className={styles.styledLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <T>News!</T>
              </a>
              <Link href="/privacy" className={styles.styledLink}><T>🔒 Privacy Info & Tips 🔒</T></Link>
              <a
                href="https://opioidpolicy.fillout.com/contact-form"
                className={styles.styledLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <T>Need help?</T>
              </a>
            </nav>
            <a
              href="https://buy.stripe.com/cN2g1p3jIdrw1W0cMM"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              <T>Support Us</T> <span>❤️</span>
            </a>
          </footer>

          {/* Shared OPI footer (same markup as opioidpolicy.org, English only). */}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
