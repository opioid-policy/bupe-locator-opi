// src/lib/i18n-markers.tsx
"use client";
import React from 'react';
import { useTranslations } from '@/lib/i18n-client';

export function T({ children, id }: { children: React.ReactNode; id?: string }) {
  const { t, translations, englishTranslations, currentLang } = useTranslations();
  
  if (!children) return null;
  
  const text = children.toString();
  
  // If explicit id provided, use it
  if (id) {
    return <>{t(id, text)}</>;
  }
  
  // Find the key by matching against ENGLISH text
  for (const [key, englishValue] of Object.entries(englishTranslations || {})) {
    if (englishValue === text) {
      // Found the key, now get the translation for current language
      const translated = translations[key] || text;
      return <>{translated}</>;
    }
  }
  
  // Fallback
  return <>{text}</>;
}

export function NoTranslate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}