# Changelog

## [3.0.0] - 2026-09-03
### Changed
- Node.js 24 on Vercel (Node 20 is end-of-life); Next.js 16.3
- OPI 2026 brand: dark surface, Fraunces / Geist / JetBrains Mono fonts (self-hosted), shared OPI footer with the projects subway map (vendored at build time from opioidpolicy.org, served from findbupe.org)
- Map tiles are proxied through /api/tiles so the browser never contacts the tile provider (CARTO now needs a free API key: CARTO_BASEMAP_KEY)
- Cloudflare Turnstile replaced by a honeypot field + form-timing check (no third-party script)
- Newsletter form is now the shared footer's form, posting to /api/newsletter-signup

### Removed
- Every third-party request from the browser: CARTO, Cloudflare, Google Fonts, GitHub/cdnjs marker images
- Debug logging of search queries, coordinates, ZIP codes and report payloads in API routes
- Unused dependencies (axios, dotenv, drizzle-orm, zip-state, react-turnstile)

### Fixed
- Dashboard cache now writes to a writable temp dir on Vercel
- Analytics counters honor Do Not Track / Global Privacy Control

## [2.1] - 2025-10-02
### Added
- More languages
- Long-acting injectable bupe as an option
- Responsive collaborator logos


## [2.0.0] - 2025-09-17
### Added
- Added support for multiple languages
- Demo mode
- Pagination for long lists
- Privacy preserving analytics

### Fixed
- Enhanced mobile experience
- Various bugs

