/** @type {import('next').NextConfig} */
// Monkey patch for url.parse() deprecation warning
import { URL } from 'url';
import url from 'url';

const originalParse = url.parse;

// Override url.parse() to use the modern URL API
url.parse = (urlString, parseQueryString, slashesDenoteHost) => {
  try {
    return new URL(urlString);
  } catch {
    // Fallback to original for invalid URLs (e.g., relative paths)
    return originalParse(urlString, parseQueryString, slashesDenoteHost);
  }
};

const nextConfig = {
  // Additional privacy settings
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy - Strict but allows necessary resources
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // ADD 'unsafe-eval' for canvas-confetti to work
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              // ADD blob: for canvas-confetti animations
              "connect-src 'self' blob: https://nominatim.openstreetmap.org https://challenges.cloudflare.com https://*.basemaps.cartocdn.com",
              "frame-src https://challenges.cloudflare.com",
              // ADD blob: for canvas worker
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },

          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },

          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },

          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },

          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },

          // Control permissions/features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
          },

          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },

          // Prevent caching of sensitive pages
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
