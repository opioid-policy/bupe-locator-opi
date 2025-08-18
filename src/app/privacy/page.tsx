// src/app/privacy/page.tsx

import styles from '../about/About.module.css';
import Link from 'next/link'; // Import the Link component

export default function PrivacyPage() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.content}>

        <h2>How We Try to Protect Your Privacy</h2>
        
 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginTop: '2rem' }}>Why We Built This Tool</h3>
        <p>
          Finding medicine to treat opioid use disorder, like buprenorphine (bupe), can be very hard. Some pharmacies don&apos;t have it, and others may refuse to fill a prescription. This can be stressful and scary.
        </p>
        <p>
          We built this tool to help. It&apos;s a map, made by the community, for the community. By sharing which pharmacies are helpful, we can make it easier for the next person to get the medicine they need. 
        </p>
        <br/>
        <p>
        But a lot of websites collect personal information. It is bad for your privacy if advertising companies know that you had an addiction. We built this website to protect that information, but we need your help to make sure this information does not get into the wrong hands.  
        </p>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginTop: '2rem' }}>What We Collect (And What We Don&apos;t)</h3>
        <p>
          Our most important promise is to protect your privacy. We have designed this site to collect **zero** personal information about you. The submission form is just enough information to be useful and not identify you. When you submit to our pharmacy bupe updater:
        </p>
        <ul>
          <li>We **do not** know your name.</li>
          <li>We **do not** know your email or phone number.</li>
          <li>We **do not** know your computer&apos;s IP address.</li>
          <li>We **do not** track your location.</li>
        </ul>
        <br />
        <p>
          The only information we need for a report is what you choose to share: the pharmacy&apos;s name, pharmacy location, the date, and whether your visit was a success or a denial. There are other questions you can choose to answer, but you do not have to. 
        </p>
        <p>
          If you use our contact form (different from the pharmacy reporting form), you are sharing personal information, but that is not avoidable with contact information. You do not have to use the contact form unless you have a question or comment. Same with our newsletter signup form, which is optional and not required to use the site.
        </p>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3 style={{ marginTop: '2rem' }}>How the Technology Works</h3>
        <p>
          We use modern, privacy-focused tools to run this site:
        </p>
        <ul>
          <li><strong>Spam Protection:</strong> We use a tool called Cloudflare Turnstile to check if a submission is from a real person, not a robot. It does this without the annoying puzzles and without building a profile of you. It is one way to protect from fake entries.</li>
          <br/> 
          <li><strong>Maps:</strong> To protect your privacy the &quot;Get Directions&quot; links and other maping uses OpenStreetMap, a non-profit mapping service. Your searches are not linked to a personal account used to build an advertising profile, unlike with Google Maps. Open Street Maps prioritizes privacy, especially compared to Google Maps. 
          <br/>
          <br/>  If you are using this website on a mobile phone it might open the pharmacy &quot;Get Direction&quot; links on a service like Google Maps on your phone. We set it up to make it easy to navigate to a pharmacy that has bupe on your phone, but using Google Maps (if that is your default) is a privacy risk (not just with this information). Google Maps uses your data to target you with advertisements, including navigating to a pharmacy. 
          <br/>
          <br/> This is bad for your privacy.
          <br/>
          <br/> However, we cannot control what apps you use on your mobile device. We suggest you use privacy preserving maping tools like: {' '}
          <Link href="https://organicmaps.app/" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
           Organic Maps
          </Link> on your phone to reduce these issuse. You can also use Google Maps in &quot;Incognito Mode&quot; but other Google &quot;Incognito Mode&quot; products were found to not actually protect your privacy, so it is best to avoid products from companies like Google, Meta/Facebook/Instagram, Amazon, Apple, Microsoft, etc to avoid them getting your information to use for advertising. </li>
          <br/>
          <li><strong>Database:</strong> Your anonymous reports are stored in a secure database called Airtable. We are the only ones with access to this data and it only includes information you submitted on the pharmacy updating tool + automatically adding time of submission (to help represent the freshness of the data).</li>
           <br/>
          <li><strong>Hosting:</strong> The website is hosted on Vercel, and we have configured it not to store logs of visitor IP addresses (so that your device is not identified).</li>
          <br/>
          <li><strong>Code:</strong> The website code (not the form data) is hosted on {' '}
          <Link href="https://codeberg.org/opioidpolicy/bupe-locator-opi" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
          Codeberg</Link> and {' '}
          <Link href="https://github.com/opioid-policy/bupe-locator-opi" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
          GitHub</Link> so that people can audit this website and suggest fixes to our privacy and security practices. 
          {' '}
          <Link href="https://opioidpolicy.fillout.com/contact-form" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
           Please reach out using our secure form if you have questions or suggestions.
          </Link> This is a community-oriented project and we appreciate the help.</li>
        </ul>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

<h3 style={{ marginTop: '2rem' }}>How to Protect Yourself</h3>
        <p>
          While our website strives to be secure and protect your privacy, your own web browser saves a history of the sites you visit. If you are using a shared computer, we strongly recommend using &quot;Private&quot; or &quot;Incognito&quot; mode in your browser. This deletes your history when you close the browser window, so no one else can see what sites you visited. It might be good to clear your browser history after using this site, even if not on a shared computer.
        </p>
         <ul>
          <li>
            You may also want to consider browsers that have better privacy protections like Mullvad on desktop or Brave on mobile. {' '}
            <Link href="https://www.privacyguides.org/en/mobile-browsers/" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
              Learn more about privacy practices on Privacy Guides.
            </Link>
          </li>
          <li>
            When you are done, you can also clear your recent browser history to remove any trace of your visit:
          </li>
          <br/>
<div>
  <div>
    <h4>Google Chrome:</h4>
    <ol>
      <li>At the top right, select <strong>More ▼</strong> and then <strong>Delete browsing data</strong>.</li>
      <li>Select how much history you want to delete (e.g., &quot;Last hour,&quot;  &quot;All time &quot;).</li>
      <li>Check the boxes for the info you want Chrome to delete, including:
        <ul>
          <li><strong>Browsing history</strong></li>
          <li>Cookies and other site data</li>
          <li>Cached images and files</li>
        </ul>
      </li>
      <li>Select <strong>Delete data</strong>.</li>
    </ol>
  </div>

  <br/>
  
  <div>
    <h4>Mozilla Firefox:</h4>
    <ol>
      <li>At the top right, click the <strong>menu button (☰)</strong> and select <strong>Settings</strong>.</li>
      <li>Select the <strong>Privacy & Security</strong> panel.</li>
      <li>In the <strong>History</strong> section, click <strong>Clear History</strong>.</li>
      <li>Select the time range to clear (e.g., &quot;Everything&quot;).</li>
      <li>Check the boxes for the information you want to clear:
        <ul>
          <li><strong>Browsing & Download History</strong></li>
          <li>Cookies</li>
          <li>Cache</li>
          <li>Active Logins</li>
          <li>Offline Website Data</li>
          <li>Site Preferences</li>
        </ul>
      </li>
      <li>Click the <strong>OK</strong> button to confirm.</li>
    </ol>
  </div>
</div>

        </ul>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />


        <h3 style={{ marginTop: '2rem' }}>Bugs or Questions?</h3>
        {/* UPDATED: This section now links to your form */}
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