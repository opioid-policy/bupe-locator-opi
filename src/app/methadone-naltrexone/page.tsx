// src/app/methadone-naltrexone/page.tsx

import styles from '../about/About.module.css'; // UPDATED: Use the 'About' page's styles
import { T, NoTranslate } from '@/lib/i18n-markers';

export default function MethadoneNaltrexonePage() {
  return (
    // UPDATED: Use the container classes from the 'About' page
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        <h2><T>A note on methadone,  naltrexone, and long-acting injectable bupe...or, why are they not included here?</T></h2>
        
        <p>
         <T>You may notice that other medications for Opioid Use Disorder (OUD) -  methadone, naltrexone, long-acting injectable bupe - are not included in our search tool. This is intentional and reflects the project&apos;s specific focus on pharmacy-based access to buprenorphine.</T>
        </p>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* --- Methadone Section --- */}
        <h3><T>More about Methadone</T></h3>

        <p>
         <T>Currently, strict federal regulations limit the dispensing of methadone for OUD to specialized Opioid Treatment Programs (OTPs), often called &quot;methadone clinics.&quot; <strong>This means patients cannot get their methadone prescription filled at their community pharmacy,</strong> which is the focus of this project. Methadone is primarily dispensed at a specific clinic daily (or nearly daily), which can be its own significant barrier to care.</T>
        </p>
        <p>
         <T>Restricting methadone access is a policy choice, not a medical necessity. Many other countries have safely integrated methadone dispensing into community pharmacies, including <strong>the United Kingdom, Canada, and Australia.</strong> In these places, a patient can pick up their medication from their local pharmacist, <strong>just like any other prescription.</strong> While we advocate for reduce methadone restrctions, this project is focused on improving access to buprenorphine through pharmacies.</T>
        </p>
        
 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* --- Naltrexone Section --- */}
        <h3><T>More about Naltrexone and Long-acting Injectable Bupe</T></h3>

        <p>
         <T>Naltrexone for OUD is most commonly prescribed as a long-acting injection. While this medication is often ordered through pharmacies, it is almost always administered in a medical setting, not dispensed directly to the patient at a pharmacy counter. Same with long-acting injectable bupe. The tablet form of naltrexone, while available at pharmacies, is less commonly used for OUD.</T>
        </p>
        <p>
        <T>Because our tool is focused on medications that patients can pick up directly from a community pharmacy, we have focused exclusively on buprenorphine to ensure our data about pharmacy access is as clear and accurate as possible.</T>
        </p>

        {/* --- External Resources Section --- */}
        <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
        
        <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}> 
          Find Methadone,  Naltrexone, and Long-acting Injectable Buprenorphine Treatment
        </h4>
        <p>
         <T> If you're in the United States, we recommend SAMHSA&apos;s Treatment Locator to find programs that use these medications (they should also include folks that prescribe bupe!).</T>
        </p>
        <a 
          href="https://www.findtreatment.gov" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.styledLink} // Use the styled link class
          style={{ display: 'inline-block', marginBottom: '2rem' }}
        >
         <T>Find Treatment</T>
        </a>

        <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}> 
         <T>Methadone Vans</T>
        </h4>
        <p>
         <T>We are not aware of a comprehensive, actively maintained list of methadone vans. This is a clever approach to increase access. If you have a resource we can link to, please reach out!</T>
        </p>
        <a 
          href="https://opioidpolicy.fillout.com/contact-form" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.styledLink} // Use the styled link class
          style={{ display: 'inline-block' }}
        >
         <T>Contact Us</T>
        </a>
      </div>
    </div>
  );
}