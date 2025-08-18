/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-leaflet', '@react-leaflet/core'],
};

module.exports = nextConfig;

// next.config.js - Add comprehensive security headers

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Vercel Analytics and Speed Insights
  analytics: false,
  
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://nominatim.openstreetmap.org https://challenges.cloudflare.com https://*.basemaps.cartocdn.com",
              "frame-src https://challenges.cloudflare.com",
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
          },
          
          // Disable FLoC tracking
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()'
          }
        ]
      }
    ];
  },
  
  // Disable telemetry and analytics
analytics: false,
telemetry: false,  

  // Additional privacy settings
  poweredByHeader: false,
  
  // Strict cookie settings
  experimental: {
    // Enable strict mode for better security
    strictNextHead: true
  }
};

module.exports = nextConfig;


// In next.config.js
headers: [
  {
    key: 'Set-Cookie',
    value: 'SameSite=Strict; Secure; HttpOnly'
  }
]