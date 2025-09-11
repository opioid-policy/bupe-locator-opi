// src/lib/i18n-markers.tsx
"use client";
import React from 'react';
import { useTranslations } from '@/lib/i18n-client';

export function T({ children, id }: { children: React.ReactNode; id?: string }) {
  const { translations, englishTranslations, currentLang } = useTranslations();
  
  if (!children) return null;
  
  const text = children.toString();
  
  // Comprehensive debug mode
  const debugMode = typeof window !== 'undefined' && 
    (window.location.search.includes('debug') || localStorage.getItem('debugTranslations') === 'true');
  
  // Add key prop to force re-render
  const reactKey = `${currentLang}-${id || text.substring(0, 20)}`;
  
  // Try to find the translation
  let translationKey = null;
  let translated = text;
  
  // Method 1: Use explicit ID
  if (id) {
    translationKey = id;
    translated = translations[id] || text;
  } else {
    // Method 2: Find by exact text match
    for (const [key, englishValue] of Object.entries(englishTranslations || {})) {
      if (englishValue === text) {
        translationKey = key;
        translated = translations[key] || text;
        break;
      }
    }
    
    // Method 3: Try normalized text match (handle special characters)
    if (translationKey === null) {
      const normalizedText = text.replace(/['']/g, "'").replace(/[""]/g, '"').trim();
      for (const [key, englishValue] of Object.entries(englishTranslations || {})) {
const normalizedEnglish = typeof englishValue === 'string' 
  ? englishValue.replace(/['']/g, "'").replace(/[""]/g, '"').trim()
  : '';       
   if (normalizedEnglish === normalizedText) {
          translationKey = key;
          translated = translations[key] || text;
          break;
        }
      }
    }
  }
  
  if (debugMode) {
    // Log untranslated text
    if (translated === text && currentLang !== 'en') {
      console.warn('Untranslated:', {
        text: text.substring(0, 50),
        searchedFor: text,
        foundKey: translationKey,
        translated: translated !== text
      });
    }
  }
  
  return <React.Fragment key={reactKey}>{translated}</React.Fragment>;
}

export function NoTranslate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}