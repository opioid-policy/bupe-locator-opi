// src/utils/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitize = (input: string): string => {
  // Create a temporary div to use DOMPurify's DOM-based cleaning
  const tempDiv = document.createElement('div');
  tempDiv.textContent = input; // First set as text to prevent XSS

  // Sanitize the content
  const cleanHtml = DOMPurify.sanitize(tempDiv.innerHTML);

  // Return just the text content to be extra safe
  const cleanTextDiv = document.createElement('div');
  cleanTextDiv.innerHTML = cleanHtml;
  return cleanTextDiv.textContent || '';
};
