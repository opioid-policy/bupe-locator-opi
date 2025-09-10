// src/app/bulk-upload/page.tsx

import styles from '../about/About.module.css'; // UPDATED: Use the 'About' page's styles
import Link from 'next/link';
import { T, NoTranslate } from '@/lib/i18n-markers';


export default function BulkUploadPage() {
  return (
    // Use the same container classes as the 'About' page for a consistent look
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        <h2><T>Bulk Data Submission Instructions</T></h2>
        <p>
        <T>For researchers conducting secret shopper studies or organizations with multiple data points (pharmacy chains??? peer recovery coaches??? prescribers??? harm reduction orgs???), we offer a bulk submission option to help populate the map quickly.</T>
        </p>

        {/* This is now a proper list */}
        <ul>
         <li><T>To help people make decisions about where they can (and can not) fill their bupe scripts, we need fresh data (ideally less than 30 days old).</T></li>
         <li><T>If you have bulk data, you can help us quickly fill out the map. Thank you!</T></li>
         <li><T>Use the spreadsheet template below to fill in your data. This format is important for batch uploading.</T></li>
         <li><T>Do not include any personally identifiable information in the notes. Simulated patient info can be included in the notes (e.g., pregnant) if relevant.</T></li>
         <li><T>We will take care of formatting and uploading to the map!</T></li>
        </ul>

        <h3><T>Step 1: Get the Template</T></h3>
        <p>
         <T>We use a standard template to ensure data quality. Please view or download our official CryptPad template.</T>
        </p>
        <a 
          href="https://cryptpad.fr/sheet/#/2/sheet/view/Io4lY8xuNT8RdTL--Me9CDwx0O4PKUB+zvyj2CNQBpE/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.styledLink} // Use the styled link class
        >
         <T>Access the Template</T>
        </a>

        <br/>
        <a 
          href="https://cryptpad.fr/doc/#/2/doc/view/6zuDknr3O2U6EBOUPQiC+JCR7wVRudzOaIHuyYeYcJY/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.styledLink} // Use the styled link class
        >
         <T>Access the Template Support Doc</T>
        </a>

        <h3 style={{ marginTop: '2rem' }}><T>Step 2: Fill Out Your Data</T></h3>
        <p>
         <T>The only required fields are pharmacy_address, report_type (success or denied). Information about formulation, standardized_notes, and notes are optional (but useful!).</T>
        </p>

        <h3 style={{ marginTop: '2rem' }}><T>Step 3: Securely Submit Your File</T></h3>
        <p>
         <T>Once your sheet is complete, please save it as a TSV file (`File` &gt; `Save as` &gt; `TSV (.tsv)`). We use TSV because some people might use commas in the address or notes line, but no one will use tabs. This makes importing and cleaning the data much more straightforward on our end and is easy to do on your end (win/win). To securely transfer files, please use the free, encrypted service WORMHOLE to send us your file.</T>
        </p>
        
        {/* This is now a proper ordered list */}
        <ol>
         <li><T>Go to <a href="https://wormhole.app" target="_blank" rel="noopener noreferrer" className={styles.styledLink}>wormhole.app</a>.</T></li>
         <li><T>Upload your TSV file (tab separated values).</T></li>
         <li><T>Copy the secure link it generates.</T></li>
         <li><T>Email that single link to us at: code[at]opioidpolicy[dot]org</T></li>
         <li><T>NB - the file link is only active for 24hrs so I might ask you to resend it. Apologies in advanced!</T></li>
        </ol>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h4 style={{ marginTop: '2rem' }}><T>Questions?</T></h4>
          <p>
         <T>If you find a problem with the site or have a question, we want to know. Please</T> {' '}
          <Link href="https://opioidpolicy.fillout.com/contact-form" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
         <T>contact us using our secure form</T>
          </Link>.
          </p>
      </div>
    </div>
  );
}