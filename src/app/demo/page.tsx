import styles from './Demo.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { T } from '@/lib/i18n-markers';

export default function DemoPage() {
  return (
    <div className={styles.demoContainer}>
      <h1><T>How to Use This Tool</T></h1>
      
      <div className={styles.demoSection}>
        <h2><T>Finding Pharmacies with Bupe</T></h2>
        <div className={styles.screenshot}>
          {/* Add your annotated screenshots here */}
          <img src="/demo/find-1.png" alt="Step 1: Enter ZIP code" />
        </div>
        <p><T>Enter your ZIP code to see pharmacies near you that have successfully filled bupe prescriptions.</T></p>
      </div>

      <div className={styles.demoSection}>
        <h2><T>Reporting Your Experience</T></h2>
        <div className={styles.screenshot}>
          <img src="/demo/report-1.png" alt="Step 1: Search for pharmacy" />
        </div>
        <p><T>Help others by reporting whether you could fill your prescription.</T></p>
      </div>

      <Link href="/" className={styles.backButton}>
        <T>Try It Yourself</T>
      </Link>
    </div>
  );
}