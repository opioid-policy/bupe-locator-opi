// src/lib/i18n-markers.tsx
"use client";
import React from 'react';
import { useTranslations } from '@/lib/i18n-client';

// Create a normalized version for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

export function T({ children, id }: { children: React.ReactNode; id?: string }) {
  const { translations, englishTranslations, currentLang } = useTranslations();
  
  if (!children) return null;
  
  const text = children.toString();
  const reactKey = `${currentLang}-${id || text.substring(0, 20)}`;
  
  // Method 1: Use explicit ID if provided
  if (id && translations[id]) {
    return <React.Fragment key={reactKey}>{translations[id]}</React.Fragment>;
  }
  
  // Method 2: Try exact match first
  for (const [key, englishValue] of Object.entries(englishTranslations || {})) {
    if (englishValue === text) {
      const translated = translations[key] || text;
      return <React.Fragment key={reactKey}>{translated}</React.Fragment>;
    }
  }
  
  // Method 3: Fuzzy match - normalize both sides and compare
  const normalizedText = normalizeText(text);
  const normalizedSubstring = normalizedText.substring(0, 50); // First 50 chars normalized
  
  for (const [key, englishValue] of Object.entries(englishTranslations || {})) {
    if (typeof englishValue === 'string') {
      const normalizedEnglish = normalizeText(englishValue);
      
      // Check if normalized versions match or if one starts with the other
      if (normalizedEnglish === normalizedText || 
          normalizedEnglish.startsWith(normalizedSubstring) ||
          normalizedText.startsWith(normalizedEnglish.substring(0, 50))) {
        
        const translated = translations[key];
        if (translated && translated !== key) {
          return <React.Fragment key={reactKey}>{translated}</React.Fragment>;
        }
      }
    }
  }
  
  // Method 4: Last resort - check if any key contains part of this text
  const firstWords = text.split(' ').slice(0, 5).join(' ').toLowerCase();
  for (const [key, englishValue] of Object.entries(englishTranslations || {})) {
    if (typeof englishValue === 'string' && englishValue.toLowerCase().includes(firstWords)) {
      const translated = translations[key];
      if (translated && translated !== key) {
        return <React.Fragment key={reactKey}>{translated}</React.Fragment>;
      }
    }
  }
  
  // Fallback to original text
  return <React.Fragment key={reactKey}>{text}</React.Fragment>;
}

export function NoTranslate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}