// src/app/about/page.tsx

import styles from './About.module.css';
import Link from 'next/link';


export default function AboutPage() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.content}>
        
        <h2>About This Project</h2>
        
        <h3>The Problem</h3>
            <p>
            There are two primary approaches to reduce opioid morbidity and mortality: medications for opioid use disorder (MOUD; e.g., buprenorphine, methadone, naltrexone) and naloxone (an opioid overdose reversal medication). MOUD are the gold-standard, FDA-approved medications used to treat people with an opioid addiction. However, barriers to MOUD are persistent and include structural and societal/racism, classism, an overactive criminal justice response to MOUD, stigma, and discrimination towards people who use drugs.
            </p>
            <p>
            Research working to understand issues with access to MOUD can be broken down into two categories: issues with finding a prescriber and issues with filling a prescription. Prior research related to finding a prescriber has highlighted longstanding barriers to care such as unethical admission practices among OUD treatment providers, MOUD provider treatment deserts, and negative perceptions towards people with and OUD among prescribers and pharmacists. Solutions to the prescriber problem have included reducing X-waiver, incentivizing providers, and stigma reduction education for providers. While these examples highlight the massive challenge of finding a prescriber to provide life-saving care, the second issue related to filling the prescription, or gaps in the “last mile”, can trip up people and reduce the ability to start or continue their medication.
            </p>
            <p>
            This project aims to address this.
            </p>
            <p>
            The “last mile” problem is the treatment gap created by pharmacy discretion over what medication is stocked and how it is dispensed by pharmacies. While much of the federal policy related to the opioid epidemic has focused on increasing MOUD prescribing among physicians and other prescribers, pharmacies are the ultimate arbiter of if this medication is dispensed. Inability to fill a prescription at the pharmacy negates all progress made by increasing prescribers.
            </p>
            <p>
            Our goal is simple: help people find bupe. Talk to most anyone who is prescribe bupe and they have a story about the challenges with filling those scripts.
            </p> 
            <p>
            This is unacceptable.
            </p>
            <p>
            We&apos;ll never forget the experience of patients in West Virginia rushing to a specific pharmacy to get their meds before it closed because it was the only one in town that filled bupe. But filling a script for opioids...that was as easy as walking into any pharmacy. It wasn&apos;t right then. It&apos;s not right now. 
            </p>

        <h3>Our Solution</h3>
          <p>
          This tool is designed to help people find bupe. That should be simple, but it&apos;s not. We do hope that one day, every pharmacy will stock this medication. However, the reality is that few do.
          </p>
          <p>
          We also hope to shine a light on just how big an issue this is. Among people touched by this issue, it&apos;s well known, but few outside those spaces know just how hard it is to get treatment for an opioid addiction. 
          </p>
          <p>
          We hope that this platform will help people help people get medicine and break the cycle of discrimination against people who use drugs or have an addiction. 
          </p>


        <h3>Our Funding</h3>
          <p>
          lol. 
          </p>
          <p>
          Like with all our other projects we&apos;re doing this in response to a need without any financial support. Like we said up top, bupe access has been something that bugged us for awhile. While research can make an impact, we think it&apos;s time for direct action. 
          </p>
          <p>
          Setting up this service is fairly low cost, we think... If successful with lots of people using it to report or find a pharmacy, it will cost some money. If successful and pharmacies actually start consistently and widely stocking bupe, we can shut down. In the mean time, we hope you&apos;ll consider donating resources to our effort (in the footer). 
          </p>
          <p>
          NB There might be a world where this data is used for research or funders see the value and throw us a few bones. If that&apos;s the case we&apos;ll update this page. 
          </p>
          <p>
          We don&apos;t favor any approach to treating opioid addiction besides evidence-based approaches. Learn more about why this project is about bupe on this page: <Link href="/methadone-naltrexone" className={styles.styledLink}>
          *What About Methadone, Naltrexone, and Long Acting Injectable Bupe?
          </Link>
          </p>
      </div>
    </div>
  );
}