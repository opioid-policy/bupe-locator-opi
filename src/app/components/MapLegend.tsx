// src/app/components/MapLegend.tsx

import styles from './MapLegend.module.css';
import { T } from '@/lib/i18n-markers';


export default function MapLegend() {
  return (
    <div className={styles.legend}>
      <h4>Legend</h4>
      <div>
        <span className={`${styles.dot} ${styles.green}`}></span>
        <T>Likely to Fill</T>
      </div>
      <div>
        <span className={`${styles.dot} ${styles.red}`}></span>
        <T>Likely to Deny / Refuse</T>
      </div>
    </div>
  );
}