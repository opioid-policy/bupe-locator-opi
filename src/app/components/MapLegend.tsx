// src/app/components/MapLegend.tsx

import styles from './MapLegend.module.css';

export default function MapLegend() {
  return (
    <div className={styles.legend}>
      <h4>Legend</h4>
      <div>
        <span className={`${styles.dot} ${styles.green}`}></span>
        Likely to Fill
      </div>
      <div>
        <span className={`${styles.dot} ${styles.red}`}></span>
        Likely to Deny / Refuse
      </div>
    </div>
  );
}