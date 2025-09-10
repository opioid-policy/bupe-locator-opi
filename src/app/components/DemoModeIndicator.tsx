// src/app/components/DemoModeIndicator.tsx
import { isDemoMode } from '@/lib/demo-data';
import styles from './DemoModeIndicator.module.css';
import { T, NoTranslate } from '@/lib/i18n-markers';


interface DemoModeIndicatorProps {
  zipCode: string;
}

export default function DemoModeIndicator({ zipCode }: DemoModeIndicatorProps) {
  if (!isDemoMode(zipCode)) {
    return null;
  }

  return (
    <div className={styles.demoIndicator}>
      <div className={styles.demoContent}>
        <span className={styles.demoIcon}>🎯</span>
        <div className={styles.demoText}>
          <strong>DEMO MODE</strong>
          <p><T>You're viewing demonstration data. This is not real pharmacy information.</T></p>
        </div>
      </div>
    </div>
  );
}
