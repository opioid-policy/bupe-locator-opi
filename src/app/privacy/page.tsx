// src/app/privacy/page.tsx

import styles from '../about/About.module.css';
import Link from 'next/link'; // Import the Link component

export default function PrivacyPage() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        
        <h2>How We Try to Protect Your Privacy</h2>
        
        <h3 style={{ marginTop: '2rem' }}>Why We Built This Tool</h3>
        <p>
          Finding medicine to treat opioid use disorder, like buprenorphine (bupe), can be very hard. Some pharmacies don&apos;t have it, and others may refuse to fill a prescription. This can be stressful and scary.
        </p>
        <p>
          We built this tool to help. It&apos;s a map, made by the community, for the community. By sharing which pharmacies are helpful, we can make it easier for the next person to get the medicine they need.
        </p>

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
        <p>
          The only information we save is the report you choose to share: the pharmacy&apos;s name, the date, the medicine, and whether your visit was a success or a denial. Your report is completely anonymous. If you use our contact form, you are sharing personal information, but that is not avoidable with contact information. You do not have to ues the contact form unless you have a question or comment.
        </p>

        <h3 style={{ marginTop: '2rem' }}>How the Technology Works</h3>
        <p>
          We use modern, privacy-focused tools to run this site:
        </p>
        <ul>
          <li><strong>Spam Protection:</strong> We use a tool called Cloudflare Turnstile to check if a submission is from a real person, not a robot. It does this without the annoying puzzles and without building a profile of you.</li>
          <li><strong>Maps:</strong> The map is provided by Mapbox, and the &quot;Get Directions&quot; links use OpenStreetMap, a non-profit mapping service, to protect your privacy. Your searches are not linked to a personal account. If you are using this website on a mobile phone it might open the pharmacy links on a service like Google Maps. Google Maps uses this data to target you with advertisements. This is bad for your privacy. However, we cannot control what apps you use on your mobile device. We suggest you use privacy preserving maping tools like: {' '}
          <Link href="https://organicmaps.app/" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
           Organic Maps
          </Link> to reduce these issuse. </li>
          <li><strong>Database:</strong> Your anonymous reports are stored in a secure database called Airtable. We are the only ones with access to this data and it only includes information you submitted on the pharmacy updating tool + automatically adding time of submission (to help represent the freshness of the data).</li>
          <li><strong>Hosting:</strong> The website is hosted on Vercel, and we have configured it not to store logs of visitor IP addresses.</li>
          <li><strong>Code:</strong> The website code (not the form data) is hosted on Codeberg and GitHub so that people can audit this website and suggest fixes to our privacy and security practices.</li>

        </ul>

<h3 style={{ marginTop: '2rem' }}>How to Protect Yourself</h3>
        <p>
          While our website is secure, your own web browser saves a history of the sites you visit. If you are using a shared computer, we strongly recommend using &quot;Private&quot; or &quot;Incognito&quot; mode in your browser.
        </p>
        
        {/* This is now a proper list */}
        <ul>
          <li>
            You may also want to consider browsers that have better privacy protections like Mullvad on desktop or Brave on mobile. {' '}
            <Link href="https://www.privacyguides.org/en/mobile-browsers/" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
              Learn more about privacy practices on Privacy Guides.
            </Link>
          </li>
          <li>
            When you are done, you can also clear your recent browser history to remove any trace of your visit.
          </li>
        </ul>

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