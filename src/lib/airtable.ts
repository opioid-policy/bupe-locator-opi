// src/lib/airtable.ts

import Airtable from 'airtable';

// Initialize Airtable with your secret key
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});

// Get a reference to our specific base and table
export const base = airtable.base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);
export const table = base(process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME!);

export default airtable;