// src/lib/i18n-markers.tsx
"use client";
import React from 'react';
import { useTranslations } from '@/lib/i18n-client';

export function T({ children, id }: { children: React.ReactNode; id?: string }) {
  const { t } = useTranslations();
  
  if (!children) return null;
  
  const text = children.toString();
  
    if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
    console.log('Looking for translation:', { id, text: text.substring(0, 30) });
  }

  // Generate key - must match extraction logic
  if (id) {
    return <>{t(id, text)}</>;
  }
  
  // Auto-generate key from text (must match extraction pattern)
  const autoKey = text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 50);
  
  // Try various key patterns that might have been generated
  const possibleKeys = [
    autoKey,
    `auto_${autoKey}`,
    // Add component-specific keys if needed
  ];
  
  for (const key of possibleKeys) {
    const translated = t(key, '');
    if (translated && translated !== key) {
      return <>{translated}</>;
    }
  }
  
  // Fallback to original text
  return <>{text}</>;
}

export function NoTranslate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}