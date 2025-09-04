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
import { useTranslations, getTextDirection } from '@/lib/i18n';
import { useEffect } from 'react';

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
  const { t, currentLang } = useTranslations();
  
  // Update document direction and lang for accessibility
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
        
        {/* Floating Language Selector */}
        <LanguageSelector />
        
        <div className={styles.appContainer}>
          <header className={styles.header}>
            <a href="/" className={styles.styledLink}>
              <h1>{t('site-title', 'Bupe Access Tool')}</h1>
            </a>
          </header>
          <main className={styles.main}>
            {children}
          </main>
          <footer className={styles.footer}>
            <p>{t('crowdsource-note', 'This is a crowd-source resource.')}</p>
            <p>{t('data-limitation-note', 'We only have data on bupe availability that has been reported to this database.')}</p>
            <p>{t('not-guarantee-note', 'This tool is not a guarantee of service. This data is not comprehensive.')}</p>
             <p style={{marginTop: '0.5rem'}}>
                <a 
                  href="https://bupe.opioidpolicy.org" 
                  className={styles.styledLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('home', 'Home')}
                </a>
              </p>           
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/about" className={styles.styledLink}>
                {t('about-project', 'About This Project')}
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/dashboard" className={styles.styledLink}>
                {t('dashboard', 'Check Out Our Dashboard')}
              </Link>
            </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/methadone-naltrexone" className={styles.styledLink}>
                {t('other-treatments', 'What About Other Treatments?')}
              </Link>
            </p>
             <p style={{marginTop: '0.5rem'}}>
              <Link href="/bulk-upload" className={styles.styledLink}>
                {t('bulk-reporting', 'Bulk Reporting Tool')}
              </Link>
            </p>
              <p style={{marginTop: '0.5rem'}}>
                <a 
                  href="https://news.opioidpolicy.org/#/portal" 
                  className={styles.styledLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('newsletter', 'Join Our Newsletter')}
                </a>
              </p>
            <p style={{marginTop: '0.5rem'}}>
              <Link href="/privacy" className={styles.styledLink}>
                 {t('privacy-info', '🔒 Privacy Info & Tips 🔒')}
              </Link>
            </p>
            <a 
              href="https://buy.stripe.com/cN2g1p3jIdrw1W0cMM"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              {t('support-us', 'Support Us')} <span>❤️</span>
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