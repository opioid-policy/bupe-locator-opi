// lib/sanitize.ts - Create this new file for input sanitization

/**
 * Sanitize user input to prevent XSS attacks
 * Removes dangerous HTML/JS while preserving safe text
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any script-like content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Escape special characters
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
  
  // Remove any potential JavaScript URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove onclick, onload, etc.
  
  // Limit length to prevent DOS
  const MAX_LENGTH = 500;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized.trim();
}

/**
 * Sanitize pharmacy name and address fields
 */
export function sanitizePharmacyData(data: any) {
  return {
    ...data,
    name: sanitizeInput(data.name || ''),
    full_address: sanitizeInput(data.full_address || ''),
    street_address: sanitizeInput(data.street_address || ''),
    city: sanitizeInput(data.city || ''),
    state: sanitizeInput(data.state || '').substring(0, 2), // State codes only
    zip_code: sanitizeInput(data.zip_code || '').replace(/\D/g, '').substring(0, 5),
    phone_number: sanitizeInput(data.phone_number || '').replace(/\D/g, '').substring(0, 15),
  };
}

// Updated API route - api/submit-report/route.ts
// Add this import at the top:
import { sanitizeInput, sanitizePharmacyData } from '@/lib/sanitize';

// In the POST function, before saving to Airtable:
const sanitizedPharmacy = sanitizePharmacyData(reportData.pharmacy);
const sanitizedNotes = sanitizeInput(reportData.notes || '');

await table.create([
  {
    fields: {
      pharmacy_id: sanitizedPharmacy.mapbox_id, // Keep original ID
      pharmacy_name: sanitizedPharmacy.name,
      street_address: sanitizedPharmacy.street_address,
      city: sanitizedPharmacy.city,
      state: sanitizedPharmacy.state,
      zip_code: sanitizedPharmacy.zip_code,
      latitude: reportData.pharmacy.latitude, // Numbers don't need sanitization
      longitude: reportData.pharmacy.longitude,
      phone_number: sanitizedPharmacy.phone_number,
      report_type: reportData.reportType,
      formulation: reportData.formulations,
      standardized_notes: reportData.standardizedNotes, // These are from checkboxes, already safe
      notes: sanitizedNotes, // Sanitize free text field
    },
  },
]);