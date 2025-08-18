// lib/env-check.ts
export function checkRequiredEnvVars() {
  const required = [
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'NEXT_PUBLIC_AIRTABLE_BASE_ID',
    'NEXT_PUBLIC_AIRTABLE_TABLE_NAME',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}