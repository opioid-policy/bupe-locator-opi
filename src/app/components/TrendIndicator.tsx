// src/app/components/TrendIndicator.tsx
"use client";

import Image from 'next/image';
import styles from '../Home.module.css';
import { T, NoTranslate } from '@/lib/i18n-markers';


interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
}

export default function TrendIndicator({ trend }: TrendIndicatorProps) {
  if (trend === 'up') {
    return (
      <span className={styles.trendIconWrapper}>
        <Image 
          src="/trend-up.png" 
          alt="Trending toward more successes"
          width={20}
          height={20}
        />
      </span>
    );
  }

  if (trend === 'down') {
    return (
      <span className={styles.trendIconWrapper}>
        <Image 
          src="/trend-down.png" 
          alt="Trending toward more denials"
          width={20}
          height={20}
        />
      </span>
    );
  }
  
  // UPDATED: Add the neutral icon
  if (trend === 'neutral') {
    return (
      <span className={styles.trendIconWrapper}>
        <Image 
          src="/trend-neutral.png" 
          alt="Trend is neutral"
          width={20}
          height={20}
        />
      </span>
    );
  }

  return null;
}