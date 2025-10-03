// src/app/layout.tsx - Updated with floating language selector
"use client";

import Link from 'next/link';
import { Raleway, Merriweather } from 'next/font/google';
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
import NewsletterSignup from './components/NewsletterSignup';

// Initialize fonts
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
  const { currentLang } = useTranslations();
  
  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = getTextDirection(currentLang);
  }, [currentLang]);

  return (
    <html lang={currentLang} dir={getTextDirection(currentLang)} suppressHydrationWarning className={`${raleway.variable} ${merriweather.variable}`}>
    <body className={`${merriweather.variable} ${raleway.variable} ${styles.body}`}>
        <ScrollToTop />
        <HashNavigator />
        <PrivacyBanner />
        <LanguageSelector />
        
        <div className={styles.appContainer}>
          <header className={styles.header}>
            <Link href="/" className={styles.styledLink}>
              <h1><T>Bupe Access Tool</T></h1>
            </Link>
          </header>
          <main className={styles.main}>
            {children}
          </main>
          <footer className={styles.footer}>
            <p><T>This is a crowd-source resource.</T></p>
            <p><T>We only have data on bupe availability that has been reported to this database.</T></p>
            <p><T>This tool is not a guarantee of service. This data is not comprehensive.</T></p>
            <TranslationNotice />
             <div style={{marginTop: '1.5rem', width: '100%', maxWidth: '500px'}}>
             <NewsletterSignup />
            </div>
            <p style={{marginTop: '0.5rem'}}>
              <a 
                href="https://findbupe.org" 
                className={styles.styledLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <T>Home</T>
              </a>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/demo" className={styles.styledLink}>
                <T>How It Works</T>
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/about" className={styles.styledLink}>
                <T>About</T>
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/dashboard" className={styles.styledLink}>
                <T>Dashboard</T>
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/methadone-naltrexone" className={styles.styledLink}>
                <T>What About Other Treatments?</T>
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/bulk-upload" className={styles.styledLink}>
                <T>Bulk Reporting Tool</T>
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <a 
                href="https://news.opioidpolicy.org/tag/find-bupe/" 
                className={styles.styledLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <T>News!</T>
              </a>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/privacy" className={styles.styledLink}>
                <T>🔒 Privacy Info & Tips 🔒</T>
              </Link>
            </p>
             <p style={{marginTop: '0.5rem'}}>
              <a 
                href="https://opioidpolicy.fillout.com/contact-form" 
                className={styles.styledLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <T>Need help?</T>
              </a>
            </p>
            <a 
              href="https://buy.stripe.com/cN2g1p3jIdrw1W0cMM"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              <T>Support Us</T> <span>❤️</span>
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