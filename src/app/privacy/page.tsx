// src/app/privacy/page.tsx
import styles from '../about/About.module.css';
import Link from 'next/link';
import { T, NoTranslate } from '@/lib/i18n-markers';


export default function PrivacyPage() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        {/* Table of Contents at the top */}
        <div className="toc" style={{ marginBottom: '2rem' }}>
          <h2><T>Table of Contents</T></h2>
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}><Link href="#why-we-built" className={styles.styledLink} ><T>Why We Built This Tool</T></Link></li>
            <li style={{ marginBottom: '0.5rem' }}><Link href="#what-we-collect" className={styles.styledLink} ><T>What We Collect (and What We Don&apos;t)</T></Link></li>
            <li style={{ marginBottom: '0.5rem' }}><Link href="#how-technology-works" className={styles.styledLink} ><T>How the Technology Works</T></Link></li>
            <li style={{ marginBottom: '0.5rem' }}><Link href="#protect-yourself" className={styles.styledLink} ><T>How to Protect Yourself</T></Link></li>
            <li style={{ marginBottom: '0.5rem' }}><Link href="#bugs-questions" className={styles.styledLink} ><T>Bugs or Questions?</T></Link></li>
          </ul>
        </div>

        {/* Why We Built This Tool Section */}
        <section id="why-we-built">
          <h2><T>How We Try to Protect Your Privacy</T></h2>
          <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <h3 style={{ marginTop: '2rem' }}><T>Why We Built This Tool</T></h3>
          <p>
           <T>Finding medicine to treat opioid use disorder, like buprenorphine (bupe), can be very hard. Some pharmacies don&apos;t have it, and others may refuse to fill a prescription. This can be stressful and scary.</T>
          </p>
          <p>
           <T>We built this tool to help. It&apos;s a map, made by the community, for the community. By sharing which pharmacies are helpful, we can make it easier for the next person to get the medicine they need. We can also show how big the problem is, so we can work to fix it.</T>
          </p>
          <p>
           <T>But we also know that privacy is very important, especially when it comes to sensitive health information like addiction. We want to make sure you are safe when using this tool, so we&apos;ve taken steps to protect your privacy. There are some steps you can take too, which we&apos;ll explain below.</T>
          </p>
        </section>

        {/* What We Collect Section */}
        <section id="what-we-collect">
          <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <h3 style={{ marginTop: '2rem' }}><T>What We Collect (and What We Don&apos;t)</T></h3>
          <p>
           <T>A lot of websites collect personal information to sell you ads or other products. Some times this is pretty sneaky and happening without you knowing or saying it is ok. That is bad for your privacy. We designed our website to not do that.</T>
          </p>
          <p>
           <T>When it comes to information like who you are, if you had an addiction, what medicine you take, or where you live, people and companies can use that to discriminate against you. So, we do not give that information or any other information about you to other companies.</T>
          </p>
          <h4 style={{ marginTop: '2rem' }}><T>There are two main ways we collect information about you with this site:</T></h4>
          <ol>
           <li><strong><T>REPORTING PHARMACY BUPE AVAILABILITY: </T></strong>
            <T>What you report is not tied to you and completely voluntary. You do not have to file reports to find bupe. On the reporting pharmacies bupe access form We intentionally do not collect any information like your name, contact information, or sneaky stuff like an IP address that identifies your device and could identify you. This means we do not know who you are, and we do not want to know. We only want to help people find bupe.</T></li>
           <li><strong><T>FINDING BUPE: </T></strong> 
           <T>We use what the ZIP code you enter to help you find pharmacies near you. We do not store your ZIP code or any other information that could identify you when you search for a pharmacy.</T></li>
          </ol>
          <br/>
         <p>
          <T>Our most important promise is to protect your privacy. We have designed this site to collect zero personal information about you. The submission form is just enough information to be useful to other people and not identify you.</T></p>
          <h4 style={{ marginTop: '2rem' }}><T>When you submit to our pharmacy bupe updater:</T></h4>
          <ul>
           <li><T>We do not know your name.</T></li>
           <li><T>We do not know your email or phone number.</T></li>
           <li><T>We do not know your computer&apos;s IP address.</T></li>
           <li><T>We do not track your location.</T></li>
          </ul>
          <br/>
          <p>
           <T>The only information we need for a report is what you choose to share: the pharmacy&apos;s name, pharmacy location, the date, and whether your visit was a success or a denial. There are other questions you can choose to answer, but you do not have to. Do not submit personal information in the notes form. If you do, we will delete it from our database.</T>
          </p>
          <h4 style={{ marginTop: '2rem' }}> <T>Optional personal information we do collect:</T></h4>
          <p>
           <T>There are some places where we collect personal information but you do not need to use these parts of the website to report or locate bupe.</T>
          </p>
          <ul>
            <li><T>If you use our contact form (different from the pharmacy reporting form), you are sharing personal information like your name and email address. You do not have to use the contact form unless you have a question or comment. We use Fillout form software.</T></li>
            <li><T>Our newsletter signup form also collects personal information like email, this is also optional and not required to use the site. We use Ghost for newsletter publishing.</T></li>
            <li><T>Lastly, our donation form collects personal information like your name, email address, and payment information. This is also optional and not required to use the site. The website is free to use and you do not have to donate to use the site. We use Stripe for payment processing.</T></li>
          </ul>
        </section>

        {/* How the Technology Works Section */}
        <section id="how-technology-works">
          <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <h3 style={{ marginTop: '2rem' }}><T>How the Technology Works</T></h3>
          <p>
           <T>We use modern, privacy-focused tools to run this site:</T>
          </p>
          <ul>
           <li>
            <strong><T>Spam Protection: </T></strong> 
           <T>We use a tool called Cloudflare Turnstile to check if a submission is from a real person, not a robot. It does this without the annoying puzzles and without building an advertising profile about the websites you visit or what you enter into a form. We use this to protect the form from fake entries.</T></li>
            <br/>
           <li>
            <strong><T>Maps: </T></strong> 
           <T>To protect your privacy the &quot;Get Directions&quot; links and other maping uses OpenStreetMap, a non-profit mapping service that has strong privacy practices. Your searches are not linked to a personal account used to build an advertising profile, unlike with Google Maps. Open Street Maps prioritizes privacy, especially compared to Google Maps.</T></li>
            <br/>
           <br/>
           <T>If you are using this website on a mobile phone it might open the pharmacy &quot;Get Direction&quot; links on a service like Google Maps on your phone. We set it up to make it easy to navigate to a pharmacy that has bupe on your phone, but using Google Maps (if that is your default) is a privacy risk (not just with this information). Google Maps uses your data to target you with advertisements, including navigating to a pharmacy.</T>
            <br/>
           <br/>
           <T>This is bad for your privacy.</T>
            <br/>
           <br/>
           <T>However, we cannot control what apps you use on your mobile device. We suggest you use privacy preserving maping tools like:</T> {' '}
            <Link href="https://organicmaps.app/" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
             Organic Maps
            </Link>
            <T> on your phone to reduce these issues. You can also use Google Maps in &quot;Incognito Mode&quot; but other Google &quot;Incognito Mode&quot; products were found to not actually protect your privacy, so it is best to avoid products from companies like Google, Meta/Facebook/Instagram, Amazon, Apple, Microsoft, etc to avoid them getting your information to use for advertising.</T>
            <br/>
            <li>
            <strong><T>Database: </T></strong>
            <T>Your anonymous reports are stored in a secure database called Airtable. We are the only ones with access to this data and it only includes information you submitted on the pharmacy updating tool + automatically adding time of submission (to help represent the freshness of the data).</T></li>
             <br/>
            <li>
             <strong><T>Hosting: </T></strong>
             <T>The website is hosted on Vercel, and we have configured it not to store logs of visitor IP addresses (so that your device is not identified).</T></li>
            <br/>
           <li>
            <strong><T>Code: </T></strong> 
           <T>The website code (not the form data) is hosted on </T> {' '}
            <Link href="https://codeberg.org/opioidpolicy/bupe-locator-opi" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
            Codeberg</Link>
            <T> and </T> {' '}
            <Link href="https://github.com/opioid-policy/bupe-locator-opi" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
            GitHub</Link> 
            <T> so that people can audit this website and suggest fixes to our privacy and security practices or new features. We are committed to transparency and open source software.</T>
            {' '}
            <Link href="https://opioidpolicy.fillout.com/contact-form" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
            <T>Please reach out using our secure form if you have questions or suggestions.</T>
            </Link> 
            <T> This is a community-oriented project and we appreciate the help.</T>
            </li>
          </ul>
        </section>

        {/* How to Protect Yourself Section */}
        <section id="protect-yourself">
          <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <h3 style={{ marginTop: '2rem' }}><T>How to Protect Yourself</T></h3>
          <p>
           <T>While our website strives to be secure and protect your privacy, your own web browser saves a history of the sites you visit. If you are using a shared computer, we strongly recommend using &quot;Private&quot; or &quot;Incognito&quot; mode in your browser. This deletes your history when you close the browser window, so no one else can see what sites you visited. It might be good to clear your browser history after using this site, even if not on a shared computer. This can help protect your privacy.</T>
          </p>
          <ul>
            <li>
             <T> You may also want to consider browsers that have better privacy protections like Mullvad on desktop or Brave on mobile.</T> {' '}
              <Link href="https://www.privacyguides.org/en/mobile-browsers/" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
               <T>Learn more about privacy practices on Privacy Guides.</T>
              </Link>
            </li>
            <li>
             <T>When you are done, you can also clear your recent browser history to remove any trace of your visit:</T>
            </li>
            <br/>
            <div>
              <div>
                <h4><NoTranslate>Google Chrome:</NoTranslate></h4>
                <ol>
                  <li><T>At the top right, select MORE ▼ and then DELETE browsing data.</T></li>
                  <li><T>Select how much history you want to delete (e.g., &quot;Last hour,&quot; &quot;All time&quot;).</T></li>
                  <li><T>Check the boxes for the info you want Chrome to delete, including:</T>
                    <ul>
                     <li><T>Browsing history</T></li>
                     <li><T>Cookies and other site data</T></li>
                     <li><T>Cached images and files</T></li>
                    </ul>
                  </li>
                 <li><T>Select DELETE DATA.</T></li>
                 <li><T>Do this each time you visit this site.</T></li>
                </ol>
              </div>
              <br/>
              <div>
                <h4><NoTranslate>Mozilla Firefox:</NoTranslate></h4>
                <ol>
                 <li><T>At the top right, click the MENU button (☰) and select SETTINGS.</T></li>
                 <li><T>Select the PRIVACY AND SECURITY  panel.</T></li>
                 <li><T>In the HISTORY section, click CLEAR HISTORY.</T></li>
                 <li><T>Select the time range to clear (e.g., &quot;Everything&quot;).</T></li>
                 <li><T>Check the boxes for the information you want to clear:</T>
                    <ul>
                     <li><T>BROWSING AND DOWNLOAD HISTORY</T></li>
                     <li><T>Cookies</T></li>
                     <li><T>Cache</T></li>
                     <li><T>Active Logins</T></li>
                     <li><T>Offline Website Data</T></li>
                     <li><T>Site Preferences</T></li>
                    </ul>
                  </li>
                 <li><T>Click the OK button to confirm.</T></li>
                 <li><T>Do this each time you visit this site.</T></li>
                </ol>
              </div>
            </div>
          </ul>
        </section>

        {/* Bugs or Questions Section */}
        <section id="bugs-questions">
          <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <h3 style={{ marginTop: '2rem' }}> <T>👾 Bugs or Questions?</T></h3>
          <p>
           <T>If you find a problem with the site or have a question, we want to know. Please</T> {' '}
            <Link href="https://opioidpolicy.fillout.com/contact-form" className={styles.styledLink} target="_blank" rel="noopener noreferrer">
              <T>contact us using our secure form</T>
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
