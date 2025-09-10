"use client";
import { useState, useEffect } from 'react';
import { loadTranslations, detectUserLanguage, setUserLanguage, languages, type Language } from './i18n';

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
  
  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };
  
  return { t, currentLang, changeLang, isLoading, languages };
}