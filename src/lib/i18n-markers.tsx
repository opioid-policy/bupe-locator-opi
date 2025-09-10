"use client";
import React from 'react';
import { useTranslations } from '@/lib/i18n-client';

export function T({ children, id }: { children: React.ReactNode; id?: string }) {
  const { t } = useTranslations();
  
  if (id) {
    return <>{t(id, children?.toString() || '')}</>;
  }
  
  const text = children?.toString() || '';
  const key = `auto_${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`;
  
  return <>{t(key, text)}</>;
}

export function NoTranslate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}