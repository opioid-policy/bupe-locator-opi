// src/lib/i18n-markers.tsx
"use client";
import React from 'react';
import { useTranslations } from '@/lib/i18n-client';

export function T({ children, id }: { children: React.ReactNode; id?: string }) {
  const { translations, englishTranslations, currentLang } = useTranslations();
  
  if (!children) return null;
  
  const text = children.toString();
  
  // Add key prop to force re-render when language changes
  const key = `${currentLang}-${id || text.substring(0, 20)}`;
  
  // If explicit id provided, use it
  if (id) {
    const translated = translations[id] || text;
    return <React.Fragment key={key}>{translated}</React.Fragment>;
  }
  
  // Special handling for form option labels
  const formOptionKeys = [
    'will-order-not-in-stock',
    'partial-fill',
    'call-ahead',
    'existing-patients-only',
    'prescribers-close-by',
    'certain-prescribers',
    'patients-close-by',
    'long-wait-times',
    'no-cash',
    'helpful-staff',
    'unhelpful-staff',
    'permanently-closed'
  ];
  
  for (const optionKey of formOptionKeys) {
    const formKey = `form.note.${optionKey}`;
    if (englishTranslations[formKey] === text) {
      const translated = translations[formKey] || text;
      return <React.Fragment key={key}>{translated}</React.Fragment>;
    }
  }
  
  // Find the key by matching against ENGLISH text
  for (const [translationKey, englishValue] of Object.entries(englishTranslations || {})) {
    if (englishValue === text) {
      const translated = translations[translationKey] || text;
      return <React.Fragment key={key}>{translated}</React.Fragment>;
    }
  }
  
  // Fallback
  return <React.Fragment key={key}>{text}</React.Fragment>;
}

export function NoTranslate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}