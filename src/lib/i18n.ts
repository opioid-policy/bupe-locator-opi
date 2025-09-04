// src/lib/i18n.ts - Complete translation system
export type Language = 'en' | 'es' | 'zh' | 'tl' | 'vi' | 'ar' | 'fr' | 'ko' | 'pt' | 'ru' | 'he' | 'de' | 'it' | 'pl' | 'scn';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag?: string;
  rtl?: boolean;
}

export const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'scn', name: 'Sicilian', nativeName: 'Sicilianu', flag: '🇮🇹' }
];

// Translation loading system
let translationsCache: Record<string, any> = {};

export async function loadTranslations(lang: Language): Promise<any> {
  if (translationsCache[lang]) {
    return translationsCache[lang];
  }

  try {
    // For bundled languages (en, es, fr) - instant load
    if (['en', 'es', 'fr'].includes(lang)) {
      const translations = await import(`../translations/${lang}.json`);
      translationsCache[lang] = translations.default;
      return translations.default;
    }

    // For extended languages - dynamic load with caching
    const response = await fetch(`/translations/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang} translations`);
    }
    
    const translations = await response.json();
    translationsCache[lang] = translations;
    return translations;
  } catch (error) {
    console.warn(`Failed to load ${lang} translations, falling back to English`);
    
    // Fallback to English
    if (lang !== 'en') {
      return loadTranslations('en');
    }
    
    // If even English fails, return basic fallback
    return {
      siteTitle: "Bupe Access Tool",
      loading: "Loading...",
      error: "Error"
    };
  }
}

// Language detection and preference management
export function detectUserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // 1. Check URL parameter (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang') as Language;
  if (urlLang && languages.find(l => l.code === urlLang)) {
    return urlLang;
  }
  
  // 2. Check session storage
  try {
    const stored = sessionStorage.getItem('preferred-language') as Language;
    if (stored && languages.find(l => l.code === stored)) {
      return stored;
    }
  } catch {
    // Fallback if sessionStorage disabled
  }
  
  // 3. Browser language detection
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  const langCode = browserLang.split('-')[0] as Language;
  
  return languages.find(l => l.code === langCode)?.code || 'en';
}

export function setUserLanguage(lang: Language): void {
  const langConfig = languages.find(l => l.code === lang);
  if (!langConfig) return;
  
  try {
    // Use sessionStorage (clears on browser close)
    sessionStorage.setItem('preferred-language', lang);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
    
    // Update document direction and lang for accessibility
    document.documentElement.lang = lang;
    document.documentElement.dir = langConfig.rtl ? 'rtl' : 'ltr';
  } catch {
    // Gracefully handle when storage is disabled
  }
}

// Translation hook
import { useState, useEffect } from 'react';

export function useTranslations() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const initializeTranslations = async () => {
      const detectedLang = detectUserLanguage();
      const translationData = await loadTranslations(detectedLang);
      
      setCurrentLang(detectedLang);
      setTranslations(translationData);
      setIsLoading(false);
    };
    
    initializeTranslations();
  }, []);
  
  const changeLang = async (newLang: Language) => {
    const langConfig = languages.find(l => l.code === newLang);
    if (!langConfig) return;
    
    setIsLoading(true);
    
    try {
      const newTranslations = await loadTranslations(newLang);
      setCurrentLang(newLang);
      setTranslations(newTranslations);
      setUserLanguage(newLang);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Translation function with fallback
  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };
  
  return { t, currentLang, changeLang, isLoading, languages };
}

// Utility functions
export function getTextDirection(lang: Language): 'ltr' | 'rtl' {
  const langConfig = languages.find(l => l.code === lang);
  return langConfig?.rtl ? 'rtl' : 'ltr';
}

export function formatDateByLanguage(dateString: string, lang: Language): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    const localeMap: Record<Language, string> = {
      en: 'en-US', es: 'es-ES', zh: 'zh-CN', tl: 'tl-PH', vi: 'vi-VN',
      ar: 'ar-SA', fr: 'fr-FR', ko: 'ko-KR', pt: 'pt-BR', ru: 'ru-RU',
      he: 'he-IL', de: 'de-DE', it: 'it-IT', pl: 'pl-PL', scn: 'it-IT'
    };
    
    return date.toLocaleDateString(localeMap[lang] || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}