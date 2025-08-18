// src/app/bulk-upload/page.tsx

import styles from '../about/About.module.css'; // UPDATED: Use the 'About' page's styles
import Link from 'next/link';

export default function BulkUploadPage() {
  return (
    // Use the same container classes as the 'About' page for a consistent look
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        <h2>Bulk Data Submission Instructions</h2>
        <p>
          For researchers conducting secret shopper studies or organizations with multiple data points (pharmacy chains??? prescribers??? harm reduction orgs???), we offer a bulk submission option to help populate the map quickly.
        </p>

        {/* This is now a proper list */}
        <ul>
          <li>To help people make decisions about where they can (and can not) fill their bupe scripts, we need fresh data (ideally less than 30 days old).</li>
          <li>If you have bulk data, you can help us quickly fill out the map. Thank you!</li>
          <li>Use the spreadsheet template below to fill in your data. This format is important for batch uploading.</li>
          <li>Do not include any personally identifiable information in the notes. Simulated patient info can be included in the notes (e.g., pregnant) if relevant.</li>
          <li>We will take care of formatting and uploading to the map!</li>
        </ul>

        <h3>Step 1: Get the Template</h3>
        <p>
          We use a standard template to ensure data quality. Please view or download our official CryptPad template.
        </p>
        <a 
          href="https://cryptpad.fr/sheet/#/2/sheet/view/Io4lY8xuNT8RdTL--Me9CDwx0O4PKUB+zvyj2CNQBpE/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.styledLink} // Use the styled link class
        >
          Access the Template
        </a>

        <br/>
        <a 
          href="https://cryptpad.fr/doc/#/2/doc/view/6zuDknr3O2U6EBOUPQiC+JCR7wVRudzOaIHuyYeYcJY/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.styledLink} // Use the styled link class
        >
          Access the Template Support Doc
        </a>

        <h3 style={{ marginTop: '2rem' }}>Step 2: Fill Out Your Data</h3>
        <p>
          The only required fields are pharmacy_address, report_type (success or denied). Information about formulation, standardized_notes, and notes are optional (but useful!).
        </p>

        <h3 style={{ marginTop: '2rem' }}>Step 3: Securely Submit Your File</h3>
        <p>
          Once your sheet is complete, please save it as a TSV file (`File` &gt; `Save as` &gt; `TSV (.tsv)`). We use TSV because some people might use commas in the address or notes line, but no one will use tabs. This makes importing and cleaning the data much more straightforward on our end and is easy to do on your end (win/win). To securely transfer files, please use the free, encrypted service WORMHOLE to send us your file.
        </p>
        
        {/* This is now a proper ordered list */}
        <ol>
          <li>Go to <a href="https://wormhole.app" target="_blank" rel="noopener noreferrer" className={styles.styledLink}>wormhole.app</a>.</li>
          <li>Upload your TSV file (tab separated values).</li>
          <li>Copy the secure link it generates.</li>
          <li>Email that single link to us at: <strong>code[at]opioidpolicy[dot]org</strong></li>
          <li>NB - the file link is only active for 24hrs so I might ask you to resend it. Apologies in advanced!</li>
        </ol>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h4 style={{ marginTop: '2rem' }}>Questions?</h4>
          <p>
          If you find a problem with the site or have a question, we want to know. Please {' '}
          <Link href="https://opioidpolicy.fillout.com/contact-form" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
          contact us using our secure form
          </Link>.
          </p>
      </div>
    </div>
  );
}