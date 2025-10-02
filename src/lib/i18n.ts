// src/lib/i18n.ts - Complete translation system
export type Language = 'en' | 'es' | 'zh' | 'tl' | 'vi' | 'ar' | 'fr' | 'ko' | 'pt' | 'he' | 'de' | 'it' | 'pl' | 'scn' | 'ru' | 'uk' | 'hmn' | 'so' | 'prs';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag?: string;
  rtl?: boolean;
}

export const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'scn', name: 'Sicilian', nativeName: 'Sicilianu' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
  { code: 'uk', name: 'Українська', nativeName: 'Українська' },
  { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'prs', name: 'Dari', nativeName: 'دری', rtl: true }
];

// Translation loading system
const translationsCache: Record<string, Record<string, string>> = {};

export async function loadTranslations(lang: Language): Promise<Record<string, string>> {
    if (translationsCache[lang]) {
    return translationsCache[lang];
  }

  try {
// For bundled languages - static imports
if (lang === 'en') {
  const translations = await import('../translations/en.json');
  translationsCache[lang] = translations.default || translations;
  return translations.default || translations;
}
if (lang === 'es') {
  const translations = await import('../translations/es.json');
  translationsCache[lang] = translations.default || translations;
  return translations.default || translations;
}


    // For extended languages - dynamic load with caching
    const response = await fetch(`/translations/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang} translations`);
    }
    
    const translations = await response.json();
    translationsCache[lang] = translations;
    return translations;
  } catch {
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
    const stored = localStorage.getItem('selectedLanguage') as Language;
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
    localStorage.setItem('selectedLanguage', lang);    
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
      ar: 'ar-SA', fr: 'fr-FR', ko: 'ko-KR', pt: 'pt-BR',
      he: 'he-IL', de: 'de-DE', it: 'it-IT', pl: 'pl-PL', 
      scn: 'it-IT', ru: 'ru-RU', uk: 'uk-UA', hmn: 'en-US', so: 'so-SO', prs: 'fa-AF'
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