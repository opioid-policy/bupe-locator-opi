/** @type {import('next').NextConfig} */

// Everything the browser loads comes from this origin: fonts, map tiles
// (proxied via /api/tiles), marker images, and the vendored OPI footer
// (public/opi/). No third-party origins are allowed by the CSP.
const CSP = [
  "default-src 'self'",
  // 'unsafe-eval' / 'unsafe-inline' are needed by canvas-confetti and Next's
  // inline runtime; there is no third-party script on the site.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.opioidpolicy.org https://opioidpolicy.org",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  // Pin the workspace root so Turbopack never infers a parent folder
  // (this repo lives inside a synced Drive tree with other lockfiles).
  turbopack: { root: __dirname },

  transpilePackages: ['react-leaflet', '@react-leaflet/core'],

  poweredByHeader: false,

  // Cache-buster for the vendored chrome (public/opi/*), fixed per build.
  env: { NEXT_PUBLIC_CHROME_V: String(Date.now()) },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Nothing on the site uses the camera, microphone, or geolocation.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
      {
        // Static, cacheable assets: tiles, vendored chrome, marker images.
        source: '/(api/tiles|opi|leaflet)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=2592000' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
