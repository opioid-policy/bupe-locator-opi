// src/app/about/page.tsx

import styles from './About.module.css';
import Link from 'next/link';
import { T } from '@/lib/i18n-markers';

export default function AboutPage() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        
        <h2><T>About This Project</T></h2>

<hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3><T>The Problem</T></h3>
            <p>
            <T>There are two primary ways to reduce opioid related disease and death (mobidity &  mortality): medications for opioid use disorder (MOUD; e.g., buprenorphine, methadone, naltrexone) and naloxone (an opioid overdose reversal medication). MOUD are the gold-standard, FDA-approved medications used to treat people with an opioid addiction. However, barriers to MOUD are persistent and include structural and societal/racism, classism, an overactive criminal justice response to MOUD, stigma, and discrimination towards people who use drugs. </T>
            </p>
            <p>
            <T>Research working to understand MOUD barriers can be broken down into two categories: issues with finding a prescriber and issues with filling a prescription. Prior research related to finding a prescriber has highlighted longstanding barriers to care such as unethical admission practices among OUD treatment providers, MOUD prescriber deserts, and negative perceptions towards people with an OUD. Solutions to the prescriber problem have included reducing prescriber training requirements, incentivizing providers, and stigma reduction education for providers. While these examples highlight the massive challenge of finding a prescriber to provide life-saving care, the second issue, filling a prescription, can reduce a person&apos;s ability to start or continue their medication.</T>
            </p>
            <p>
           <T>This project aims to address this.</T>
            </p>
            <p>
           <T>The “last mile” problem is the treatment gap created by pharmacy discretion over what MOUD is stocked (if any) and how it is dispensed by pharmacies. While much of the federal policy related to the opioid epidemic has focused on increasing MOUD prescribing among prescribers, pharmacies ultimately decide whether MOUD is dispensed. Inability to fill a prescription at the pharmacy negates all progress made by increasing prescribers.</T>
            </p>
            <p>
           <T>Our goal is simple: help people find bupe. Talk to almost anyone who is prescribed bupe, and they have a story about the challenges with filling those scripts.</T>
            </p> 
            <p>
           <T>This is unacceptable.</T>
            </p>
            <p>
           <T>We&apos;ll never forget the experience of patients in West Virginia rushing to a specific pharmacy to get their meds before it closed because it was the only one in town that filled bupe. But filling a script for opioid pain medication...that was as easy as walking into any pharmacy. It wasn&apos;t right then. It&apos;s not right now.</T>
            </p>

<hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3><T>Our Solution</T></h3>
          <p>
         <T>This tool is designed to help people find bupe. That should be simple, but it&apos;s not. By crowd-sourcing data related to bupe access, we help the people facing these issues navigate challenges and helping others in their community. We do hope that one day, every pharmacy will stock this medication. However, the reality is that few do. In the meantime, we hope this tool will help.</T>
         </p>
          <p>
         <T>We also hope to shine a light on just how big an issue this is. Among people touched by this issue, it&apos;s well known, but few outside those spaces know just how hard it is to get treatment for an opioid addiction. Policy fixes to date have been inadequate. While this database might not be comprehensive, we hope it starts a conversation and action towards meaningfully closing these gaps.</T>
          </p>
          <p>
         <T>We hope that this platform will help people help people get medicine and break the cycle of discrimination against people who use drugs or have an addiction.</T>
          </p>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <h3><T>Our Funding</T></h3>
          <p>
         <T>lol.</T>
          </p>
          <p>
         <T>Like with our other projects, we built this in response to a need without any financial support. We also don&apos;t wait for external validation from granting organizations. If it needs to be done, we&apos;ll do it.</T>
          </p>
          <p>
          <T>Like we said up top, bupe access has been something that bugged us for a while. We have done some research and advocacy related to these problems and hope that has an impact...but we think it&apos;s time for direct action.</T>       
          </p>
          <p>
          <T>Setting up this service is fairly low cost, we think... If successful with lots of people using it to report or find a pharmacy, it will cost some money. If successful and pharmacies actually start consistently and widely stocking bupe, we can shut down. In the meantime, we hope you&apos;ll consider donating resources to our effort (in the footer).</T>
          </p>
          <p>
         <T>NB There might be a world where this data is used for research or funders see the value and throw us a few bones. If that&apos;s the case we&apos;ll update this page.</T>
          </p>
          <p>
         <T>We don&apos;t favor any approach to treating opioid addiction besides evidence-based approaches. Learn more about why this project is about bupe on this page:</T> <Link href="/methadone-naltrexone" className={styles.styledLink}>
         <T>*What About Methadone, Naltrexone, and Long Acting Injectable Bupe?</T>
          </Link>
          </p>

 <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <h3><T>Translations</T></h3>
          <p>
         <T>To increase accessibility, we are working on translating this tool into multiple languages. To be consistent with our principles, that means doing it in a privacy preserving way, but this approach is not perfect and there might be issues with the translations we use. Feel free to reach out if you see something wrong or make edits to the GitHub or Codeberg translations files for the language you are interested helping with. Just compare the English extraction file with the langauge you want to help with. If you do not know how to do that but would like to help with translations, please let us know through our contact form! If you would like more languages, also let us know!</T>
         </p>
      </div>
    </div>
  );
}