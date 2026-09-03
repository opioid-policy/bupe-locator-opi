// lib/env-check.ts
export function checkRequiredEnvVars() {
  const required = [
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'AIRTABLE_BASE_ID',
    'AIRTABLE_TABLE_NAME',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}