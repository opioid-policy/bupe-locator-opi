// src/app/components/SponsorLogo.tsx
"use client";
import { SPONSOR_LOGOS } from "@/config/sponsors";
import { getStateFromZipCode } from '@/utils/state-utils';
import Image from 'next/image';

interface SponsorLogoProps {
  zipCode?: string;
}

// Complete mapping from state names to abbreviations for all 50 states + DC
const STATE_NAME_TO_ABBR: Record<string, string> = {
  'Alabama': 'AL',
  'Alaska': 'AK', 
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'District of Columbia': 'DC',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY'
};

export function SponsorLogo({ zipCode }: SponsorLogoProps) {
  if (!zipCode) return null;

  // Use your existing utility to get the state name
  const stateName = getStateFromZipCode(zipCode);
  
  if (!stateName) return null;

  // Convert state name to abbreviation
  const stateAbbr = STATE_NAME_TO_ABBR[stateName];
  
  if (!stateAbbr) return null;

  // Look up sponsor logo
  const sponsor = SPONSOR_LOGOS[stateAbbr as keyof typeof SPONSOR_LOGOS];
  
  if (!sponsor) return null;

  return (
    <div style={{
      marginTop: '2rem',
      textAlign: 'center',
      padding: '1rem',
      backgroundColor: 'var(--accent-cream)',
      borderRadius: '0.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--font-color-dark)',
        marginBottom: '1rem',
        fontWeight: 500
      }}>
        Proudly supported by:
      </p>
      <Image
        src={sponsor.logo}
        alt={sponsor.alt}
        width={120}
        height={48}
        priority
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
}