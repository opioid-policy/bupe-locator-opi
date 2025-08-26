## Technical Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Accounts: Airtable, Cloudflare Turnstile, Vercel, GitHub, Codeberg, Cloudflare DNS

### Installation
1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Fill in your API keys
4. Run `npm install`
5. Run `npm run dev` for development

### Deployment
This project is configured for Vercel deployment.

### Security & Privacy
- No user data is stored except what is submitted through the form
- No cookies or tracking
- IP addresses are not logged
- All submissions are anonymous



## Why Do This

This project was built to help people find buprenorphine (bupe) in pharmacies. Bupe is used to treat opioid addiction. Many pharmacies do not stock it. This makes it hard to fill a prescription. Which makes treatment hard, and treatment is already harder than it should be. 

This is bad. 

For those interested in treatment, we must facilitate access to care rather than create obstacles. While obstacles occur across healthcare, the risks associated with opioid addiction are significantly heightened by an unsafe drug supply, a direct consequence of ongoing drug criminalization.

For those reasons, we built this project to help people report pharmacies that fill bupe scripts, those that don’t, and any other relevant info to help folks get meds (e.g., doesn’t take cash, out of stock).Based on this data, people can find pharmacies near them that have bupe.

We were driven to action by the frustration faced by people seeking meds and have been trying to figure out how to have an impact. We conduct research and advocacy on this topic but prefer direct action. This project is the result.

When trying to find ways to address this issue were inspired by the McFlurry Down Detector (https://github.com/filippofinke/mcbroken) from back in the day, but obviously that wouldn’t work for a controlled substance at a pharmacy. So we hit a wall. To break this barrier, we used various AI tools to help with code (just kinda rotated, pretty sure it took way longer than it should have…). 

We're using vercel, open street maps, cloudflare, airtable, github, codeberg as our tech stack (we know it's redundant..but codeberg and vercel didn’t play nice together, but I still wanted to use codeberg). We tried to make it perform well on mobile, because a lot of folks don’t have a computer or limited access. Because addiction is a protected health condition, we attempted to make this maximally privacy preserving for people reporting pharmacies, finding pharmacies, or just visiting the site.

Any one of these things might have been messed up. We’ve never done a project like this from scratch (usually use WYSIWYG web tools), so I’m sure the code is a mess and we might have missed something. This effort is not funded so we tried to keep costs down while still accomplishing our end goals. 

If we missed something, please let us know. 

We’ll keep trying to improve and respond to feedback.

Check out our other stuff at https://opioidpolicy.org
Consider donating at https://buy.stripe.com/cN2g1p3jIdrw1W0cMM 