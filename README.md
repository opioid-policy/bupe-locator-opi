# Opioid Policy Institute Bupe Locator 

![Version](https://img.shields.io/badge/version-3.0.0-green)
![Release](https://img.shields.io/badge/release-stable-brightgreen)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/opioid-policy/bupe-locator-opi)

[**Latest Stable Release: v3.0.0 🤘**](https://github.com/opioid-policy/bupe-locator-opi/releases/tag/v3.0.0)

## What's New in Version 3.0.0
- Zero third-party requests from the browser: map tiles proxied through our server, Turnstile replaced by a honeypot + timing check, fonts and marker images self-hosted
- OPI 2026 brand and the shared OPI footer
- Node.js 24, Next.js 16.3, fewer dependencies

## What was new in 2.1.1
- Patch next.js & react for 12.3.25 vulnerability
- More languages
- Long-acting injectable bupe as an option
- Responsive collaborator logos


## Technical Setup

### Prerequisites
- Node.js 24 (Vercel runs Node 24.x; Node 20 is end-of-life)
- pnpm
- Accounts: Airtable, Vercel, GitHub, Codeberg, Cloudflare DNS, and a free CARTO basemap key (https://carto.com/basemaps/apikey)
- Git
- IDE (I use VS Code)

### Installation
1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Fill in your API keys
4. Run `pnpm install`
5. Run `pnpm run dev` for development

Notes:
- `pnpm build` first runs `scripts/sync-opi-chrome.mjs`, which refreshes the shared OPI footer/CSS in `public/opi/` from opioidpolicy.org. If that site is unreachable the committed copy is kept; if the upstream files change shape the build fails on purpose.
- Keep the repo on a local disk. Google Drive breaks pnpm's links (the `.npmrc` here uses the hoisted layout as a workaround, but installs take ~25 minutes there).

### Deployment
This project deploys to Vercel from the `main` branch (Node 24, set via `engines` in package.json). Set the same variables as `.env.example` in the Vercel project.

### Security & Privacy
- No user data is stored except what is submitted through the form
- No cookies or tracking
- IP addresses are not logged
- All submissions are anonymous
- The browser only ever talks to findbupe.org: map tiles are proxied through `/api/tiles`, fonts, marker images and the OPI footer are served from this site, and the strict Content-Security-Policy in `next.config.js` blocks every other origin
- Bot protection is a hidden honeypot field plus a form-timing check (`src/lib/anti-spam.ts`), not a third-party captcha



## Why We Did This
~50% of pharmacies don't stock buprenorphine...that's a massive problem.

Alongside methadone and naltrexone, buprenorphine (bupe) is recognized as the gold standard for supporting people with opioid addiction. Bupe reduces cravings, eases withdrawal, and lowers opioid overdose risks. But access to these FDA-approved medications has long been deliberately restricted.
The barriers are rooted in systemic oppression: racism, classism, the criminalization of survival, and the stigma that dehumanizes people who use drugs. These barriers are tools of control, reinforcing hierarchies that prioritize profit and punishment over care and autonomy.

Through a mutual aid framework, we have developed a community-led solution that puts power back in the hands of those most affected by the opioid crisis. The fight for bupe access is part of a larger struggle towards a world where needs are met and flourishing is enabled.

For those interested in treatment, we must facilitate access to care rather than create obstacles. While obstacles occur across healthcare, the risks associated with opioid addiction are significantly heightened by an unsafe drug supply, a direct consequence of ongoing drug criminalization.

For those reasons, we built this project to help people report pharmacies that fill bupe scripts, those that don’t, and any other relevant info to help folks get meds (e.g., doesn’t take cash, out of stock). Based on this data, people can find pharmacies near them that have bupe.

##Our Solution
By enabling knowledge sharing about bupe access, our tool helps people reclaim control over their care. This isn’t just about mapping where medicine is available—it’s about exposing the deliberate barriers that keep life-saving treatment out of reach. The state and medical institutions have failed to address this crisis, leaving people to navigate a broken system alone. This tool is a step towards fixing that.

Our resource isn’t perfect. It relies on people already fighting against an unjust system to do another thing (i.e., report bupe access issues). This is not ideal. Better solutions might exist in the future, including meaningful policy changes (more on this later..it's not going well). 

We wish we could pull real-time bupe availability like the McFlurry down detector (an inspiration !) but pharmacies don’t make that data available for controlled substances. 
By design, the database starts today with zero pharmacies. It's utility only comes from community members using it and sharing it. 

Whether you're a person taking bupe, a provider, a harm reduction worker, or a pharmacist, you have a role in reporting bupe access to help people navigate this system.

This tool is just the start—a way for us to support each other, share resources, and organize. Our goal isn’t just to highlight the gaps; it’s to fill them ourselves, through solidarity and direct action.
 
##How We Did This

We're using vercel, open street maps, carto basemaps, airtable, github, codeberg as our tech stack (we know it's redundant..but codeberg and vercel didn’t play nice together, but I still wanted to use codeberg). We tried to make it perform well on mobile, because a lot of folks don’t have a computer or limited access. Because addiction is a protected health condition, we attempted to make this maximally privacy preserving for people reporting pharmacies, finding pharmacies, or just visiting the site.

Any one of these things might have been messed up. We’ve never done a project like this from scratch (usually use WYSIWYG web tools), so I’m sure the code is a mess and we might have missed something. This effort is not funded so we tried to keep costs down while still accomplishing our end goals. 

If we missed something, please let us know. We appreciate that.

We’ll keep trying to improve and respond to feedback.

Check out our other stuff at https://opioidpolicy.org
Consider donating at https://buy.stripe.com/cN2g1p3jIdrw1W0cMM 
