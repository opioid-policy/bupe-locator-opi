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

// Define proper interface for pharmacy data
interface PharmacyData {
  name?: string;
  full_address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_number?: string;
  mapbox_id?: string; // Add this for compatibility
  id?: string; // Add this for manual entries
  [key: string]: unknown; // Allow other properties but be specific about known ones
}

/**
 * Sanitize pharmacy name and address fields
 */
export function sanitizePharmacyData(data: PharmacyData): PharmacyData {
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