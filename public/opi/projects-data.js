/* ==========================================================
   OPI Projects — Single Source of Truth
   ----------------------------------------------------------
   Edit this array to add, remove, or update project cards on
   index.html and projects.html AND project stations on the
   subway map (full version on projects.html, mini-map in the
   site footer). Both views read from this file:
     /js/projects-render.js — card grid
     /js/subway-map.js      — subway map (SVG)

   Card-grid fields:
   - id          — internal short ID, snake-or-kebab-case
   - href        — link target (use "#" for placeholders)
   - external    — true to add target=_blank rel=noopener on cards
   - classes     — base classes; per-theme like card-settlements
   - category    — space-separated filter tags (matches filter-btn[data-filter])
   - hero        — true to sort first (the original 6 hero cards)
   - launched    — ISO date; auto-applies NEW badge if within 90d
   - tier        — 'main' (default) or 'garage' (gets door overlay)
   - tag         — text inside .initiative-tag chip
   - titleHtml   — h4 inner HTML (allows spans for redacted/cli markup)
   - bodyHtml    — p inner HTML
   - arrow       — text inside .initiative-arrow link CTA

   Subway-map fields:
   - line        — primary topic line. One of:
                   opioid_settlements (atomic-purple #8f00ff)
                   advocacy (strong-red #f71824)
                   privacy (strong-green #00ff85)
                   research (strong-yellow #fdc919)
                   civic_tech (blaze-orange #ff580f)
                   hub (Home center only).
   - alsoOn      — array of secondary line IDs (interchange rings)
   - audiences   — array of: 'community members', 'journalists',
                   "gov't officials".
   - status      — 'live' (default) or 'coming-soon' (auto-set for
                   tier:'garage' entries; rendered dashed).

   Visibility flags:
   - mapOnly: true   — appears as a subway station only, no card.
                       Used for the Home hub.
   - cardOnly: true  — appears in the card grid only, no station.
                       Used for umbrella projects whose work is
                       represented on the map by sub-projects.
   ==========================================================*/
window.OPI_PROJECTS = [
  /* --- Hub (map-only; the center of the subway map) --- */
  {
    id: "home",
    href: "/",
    mapOnly: true,
    line: "hub",
    audiences: ["community members", "journalists", "gov't officials"],
    titleHtml: "Home",
  },

  /* --- Hero tier (6 cards, sorted first via order:-2) --- */
  {
    id: "settlement-watchdog",
    href: "/osm-settlements",
    classes: ["initiative-card", "card-settlements"],
    category: "research advocacy opioid-settlements",
    hero: true,
    cardOnly: true, // umbrella project — shown as the watchdog overview card; on the map, its sub-projects (WFAM, Wiki, etc.) carry the settlement work
    tag: "opioid-settlements",
    titleHtml: 'Opioid Settlement <span class="redacted">Watchdog</span>',
    bodyHtml:
      'Tracking +$55 billion in opioid settlement funds. Exposing <span class="redacted">waste</span>, <span class="redacted">fraud</span>, <span class="redacted">abuse</span>, and <span class="redacted">mismanagement</span> (WFAM). Providing technical assistance for <span class="redacted">community-led opioid settlement monitoring</span> and <span class="redacted">governments.</span>',
    arrow: "Get involved →",
  },
  {
    id: "digital-health",
    href: "/addiction-privacy",
    classes: ["initiative-card", "card-digital"],
    category: "research advocacy privacy",
    hero: true,
    line: "privacy",
    alsoOn: ["research"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "privacy",
    mapLabel: "Addiction Privacy",
    titleHtml:
      '<span class="cli-prompt">$ </span><span class="cli-keyword">expose</span> <span class="cli-string">"surveillance_capitalism" --sector=addiction_treatment</span><span class="cursor"></span>',
    bodyHtml:
      "We're investigating how digital health approaches exploit people seeking addiction treatment and recovery support.",
    arrow: "./learn_more",
  },
  {
    id: "privacy-consulting",
    href: "/privacy-consulting",
    classes: ["initiative-card", "card-digital"],
    category: "civic_tech research advocacy privacy",
    hero: true,
    line: "privacy",
    alsoOn: ["civic_tech"],
    audiences: ["community members"],
    tag: "privacy",
    mapLabel: "Privacy Mutual Aid",
    titleHtml: "Protecting the privacy of people with an opioid addiction.",
    bodyHtml:
      "We provide mutual aid support to community-based harm reduction orgs to help protect people seeking life-saving services.",
    arrow: "Learn more →",
  },
  {
    id: "unallowable-guide",
    href: "https://unallowablespending.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "research advocacy opioid-settlements",
    launched: "2026-05-03",
    line: "opioid_settlements",
    alsoOn: ["advocacy"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    osLabel: "Unallowable Spending",
    titleHtml: "Unallowable Opioid Settlement Spending Guidance",
    bodyHtml:
      "A searchable, sortable list of unallowable opioid settlement spending with rationale drawn from the states that provided guidance and the experts at the Opioid Policy Institute.",
    arrow: "View the guide →",
  },
  {
    id: "wfam-database",
    href: "/osm-accountability-hub#database",
    classes: ["initiative-card", "card-t2-research"],
    category: "research advocacy opioid-settlements",
    line: "opioid_settlements",
    alsoOn: ["research", "advocacy", "civic_tech"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    titleHtml: "WFAM Database",
    bodyHtml:
      "A crowdsourced database tracking problematic opioid settlement spending (waste, fraud, abuse, and mismanagement; WFAM) across all opioid settlements.",
    arrow: "Contribute to or search the database →",
  },
  {
    id: "reporting-on-addiction",
    href: "https://reportingonaddiction.org",
    external: true,
    classes: ["initiative-card", "card-reporting"],
    category: "research",
    hero: true,
    line: "research",
    audiences: ["community members", "journalists"],
    tag: "research",
    titleHtml: "Reporting on Addiction",
    bodyHtml:
      "An independent non-profit project that OPI founded to improve how the media covers drug use and addiction. Our goal? Helping journalists tell accurate, empathetic, and impactful stories.",
    arrow: "Visit project →",
  },
  {
    id: "naloxone",
    href: "/naloxone",
    classes: ["initiative-card", "card-naloxone"],
    category: "research advocacy",
    hero: true,
    line: "advocacy",
    alsoOn: ["research", "opioid_settlements"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "advocacy",
    osLabel: "Naloxone",
    titleHtml: "Exposing Naloxone Profiteering",
    bodyHtml:
      "Tracking the price gouging, patent games, and lobbying that keeps naloxone out of reach. We're working towards a world where low dose/low cost naloxone is widely available for the communities that need it most.",
    arrow: "Join us →",
  },
  {
    id: "findbupe",
    href: "https://findbupe.org",
    external: true,
    classes: ["initiative-card", "card-findbupe"],
    category: "advocacy civic-tech",
    hero: true,
    line: "civic_tech",
    alsoOn: ["advocacy"],
    audiences: ["community members", "journalists"],
    tag: "civic-tech",
    titleHtml: "FindBupe.org",
    bodyHtml:
      "Access to medications for opioid use disorder remains a challenge. We built a crowdsourced tool to help people find buprenorphine at their community pharmacies.",
    arrow: "Find or report pharmacy →",
  },
  {
    id: "policy-advocacy",
    href: "https://news.opioidpolicy.org/tag/policy/",
    external: true,
    classes: ["initiative-card", "card-advocacy"],
    category: "advocacy",
    hero: true,
    cardOnly: true, // umbrella project — advocacy work shown via sub-projects on the map
    tag: "advocacy",
    titleHtml: "Policy Advocacy",
    bodyHtml:
      "Legislative testimony, public comment, and direct advocacy. Fighting for evidence-based policy at the local, state, and federal level.",
    arrow: "Watch & read →",
  },

  /* --- Tier-2 cards (sorted after hero, before garage) --- */
  {
    id: "find-treatment",
    href: "/finding-treatment",
    classes: ["initiative-card", "card-t2-research"],
    category: "research advocacy privacy",
    launched: "2026-05-03",
    line: "research",
    alsoOn: ["privacy"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "research",
    osLabel: "Finding Treatment",
    titleHtml: "Finding Addiction Treatment Online",
    bodyHtml:
      "We conduct privacy audits and usability research to evaluate how people find addiction treatment online.",
    arrow: "Read the research →",
  },
  {
    id: "app-privacy-research",
    href: "/addiction-privacy",
    classes: ["initiative-card", "card-t2-research"],
    category: "research advocacy privacy",
    line: "privacy",
    alsoOn: ["research"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "privacy",
    titleHtml: "App Privacy Research",
    bodyHtml:
      "Privacy research focused on addiction treatment apps. Understanding and evaluating how these companies live up to privacy promises and privacy expectations.",
    arrow: "Read the research →",
  },
  {
    id: "website-privacy-research",
    href: "/addiction-privacy",
    classes: ["initiative-card", "card-t2-research"],
    category: "research advocacy privacy",
    line: "privacy",
    alsoOn: ["research"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "privacy",
    titleHtml: "Website Privacy Research",
    bodyHtml:
      "Privacy research focused on addiction treatment websites. Understanding and evaluating how these companies live up to privacy promises and privacy expectations.",
    arrow: "Read the research →",
  },
  {
    id: "settlement-wiki",
    href: "https://wiki.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "research civic-tech opioid-settlements",
    launched: "2026-05-03",
    line: "opioid_settlements",
    alsoOn: ["civic_tech"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    titleHtml: "Opioid Settlement Wiki",
    bodyHtml:
      "A crowdsourced reference for people to learn and share knowledge about opioid settlements.",
    arrow: "Browse the wiki →",
  },
  {
    id: "settlement-roadmap",
    href: "https://opioidsettlementroadmap.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "advocacy opioid-settlements",
    line: "advocacy",
    alsoOn: ["opioid_settlements"],
    audiences: ["community members", "gov't officials"],
    tag: "advocacy",
    titleHtml: "Opioid Settlement Roadmap",
    bodyHtml:
      "A community driven roadmap to help guide opioid settlement spending.",
    arrow: "Follow the roadmap →",
  },
  {
    id: "nj-watch",
    href: "https://45milliondollarwatch.org",
    external: true,
    classes: ["initiative-card", "card-t2-advocacy"],
    category: "advocacy opioid-settlements",
    launched: "2026-05-03",
    line: "advocacy",
    alsoOn: ["opioid_settlements"],
    audiences: ["community members", "journalists"],
    tag: "advocacy",
    titleHtml: "45 Million Dollar Watch",
    bodyHtml:
      "In collaboration with Sea Change Recovery Community Organization and Harm Reduction Center (NJ) we are keeping an eye on the $45M that the New Jersey legislature stole from opioid settlement funds and spent to fill hospital system budget gaps.",
    arrow: "Track NJ spending →",
  },
  {
    id: "discussion-board",
    href: "https://discuss.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "civic-tech",
    launched: "2026-05-03",
    line: "civic_tech",
    alsoOn: ["advocacy"],
    audiences: ["community members"],
    tag: "civic-tech",
    titleHtml: "Opioid Policy Discussion Board",
    bodyHtml:
      "A forum for advocates, researchers, and people impacted by the opioid crisis to talk about opioid settlement money.",
    arrow: "Join the conversation →",
  },
  {
    id: "settlement-sifter",
    href: "https://settlementsifter.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "civic-tech research opioid-settlements",
    launched: "2026-07-16",
    line: "civic_tech",
    alsoOn: ["research", "opioid_settlements"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "civic-tech",
    titleHtml: "Opioid Settlement Sifter",
    bodyHtml:
      "A custom app to help people flag problematic opioid settlement spending. Leverages OPI's WFAM database and unallowable spending research.",
    arrow: "Download →",
  },
  {
    // Moved out of the garage 2026-07-22; public launch Friday 2026-07-24.
    id: "data-liberation",
    href: "https://dataliberation.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "research civic-tech opioid-settlements",
    launched: "2026-07-24",
    line: "opioid_settlements",
    alsoOn: ["research", "civic_tech"],
    audiences: ["community members"],
    tag: "opioid-settlements",
    titleHtml: "Data Liberation",
    bodyHtml:
      "Helping community members unlock opioid spending information through the power of Freedom of Information Act (FOIA) requests. A collaboration with MuckRock and Data Liberation Project.",
    arrow: "Get involved →",
  },
  {
    id: "nopvee",
    href: "https://nopveecollective.org",
    external: true,
    classes: ["initiative-card", "card-t2-advocacy", "card-nopvee"],
    category: "advocacy",
    line: "advocacy",
    audiences: ["community members"],
    tag: "advocacy",
    titleHtml: "nopvee collective",
    bodyHtml: "Harm reduction collective and naloxone advocacy hub.",
    arrow: "Learn more →",
  },
  {
    id: "newsletter",
    href: "https://news.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "research advocacy",
    line: "research",
    alsoOn: ["advocacy"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "research",
    titleHtml: "OPI Newsletter",
    bodyHtml: "Research and related updates (roughly 1x/week).",
    arrow: "Subscribe →",
  },
  {
    // Single consolidated subway station for ALL whitepapers — links to the
    // dedicated /whitepapers.html grid (where the per-paper cards live with
    // covers + dates + authors). mapOnly so it doesn't double up as a card.
    id: "whitepapers",
    href: "/whitepapers",
    mapOnly: true,
    line: "research",
    alsoOn: ["opioid_settlements", "advocacy", "privacy"],
    audiences: ["community members", "journalists", "gov't officials"],
    titleHtml: "Whitepapers",
  },
  {
    id: "unallowable-whitepaper",
    href: "https://unallowablespending.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-whitepaper"],
    category: "research advocacy opioid-settlements",
    launched: "2026-04-01",
    cardOnly: true, // grid card only; subway condensed to single 'whitepapers' station
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    titleHtml: "Unallowable Spending Whitepaper",
    bodyHtml:
      "Comprehensive analysis of state guidance about unallowable opioid settlement spending. Only 5 states offered guidance, leaving 90% of opioid settlement money without clear guardrails.",
    arrow: "Read the whitepaper →",
  },
  {
    id: "ag-whitepaper",
    href: "https://news.opioidpolicy.org/wfam-accountability-whitepaper/",
    external: true,
    classes: ["initiative-card", "card-t2-whitepaper"],
    category: "research advocacy opioid-settlements",
    cardOnly: true, // grid card only; subway condensed to single 'whitepapers' station
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    titleHtml: "AG Accountability Whitepaper",
    bodyHtml:
      "Examination of how state Attorneys General facilitate reporting of problematic opioid settlement spending to enable accountability action.",
    arrow: "Read the whitepaper →",
  },
  {
    id: "policy-briefs",
    href: "/policy-briefs",
    classes: ["initiative-card", "card-t2-whitepaper"],
    category: "advocacy opioid-settlements",
    line: "opioid_settlements",
    alsoOn: ["advocacy", "research"],
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    titleHtml: "Opioid Settlement Policy Briefs",
    bodyHtml:
      "Short-form policy analysis of good and bad opioid settlement spending. Clear cut guidance tailored for busy decision makers.",
    arrow: "Browse briefs →",
  },
  {
    id: "drug-boat-strike",
    href: "https://drugboatstrike.com",
    external: true,
    classes: ["initiative-card", "card-t2-advocacy"],
    category: "advocacy civic-tech",
    launched: "2026-07-22",
    line: "advocacy",
    alsoOn: ["civic_tech"],
    audiences: ["community members", "journalists"],
    tag: "advocacy",
    mapLabel: "Drug Boat, Strike!",
    titleHtml: "Drug Boat, Strike!",
    bodyHtml:"The war on drugs is back. In the stupidest way possible. Join pilots Pete, DJT, JD, and Little Marco in their efforts to protect America from fentanyl with war crimes and million-dollar missiles. An OPI arcade classic.",
    arrow: "Play →",
  },
  {
    id: "mobtown-redux",
    href: "https://mobtownredux.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-t2-subdomain"],
    category: "civic-tech",
    launched: "2026-06-20",
    line: "civic_tech",
    audiences: ["journalists", "community members"],
    tag: "civic-tech",
    titleHtml: "Mobtown Redux (Redux)",
    bodyHtml:
      "Mobtown Redux (Redux) is preserved as a memorial archive to its founder, Logan Hullinger, who died on March 6, 2026. This site is a tribute to his work as a harm reduction journalist and, hopefully, can serve as an example to others.",
    arrow: "Visit the archive →",
  },

  /* --- Garage tier (in-development; door overlay added by render).
       All status: 'coming-soon' on the subway map (rendered dashed). --- */
  {
    id: "garage-neighborhood",
    href: "https://neighborhood.opioidpolicy.org",
    external: true,
    classes: ["initiative-card", "card-garage"],
    category: "garage",
    tier: "garage",
    status: "coming-soon",
    line: "opioid_settlements",
    audiences: ["community members", "journalists", "gov't officials"],
    tag: "opioid-settlements",
    titleHtml: "OPI + NBHRN Opioid Settlement Neighborhood",
    bodyHtml:
      "A hub, built with the National Black Harm Reduction Network, of all the orgs tracking opioid settlement money in their community.",
    arrow: "Peek inside →",
  },
  {
    id: "garage-nbhrn-template",
    href: "https://codeberg.org/opioidpolicy/settlement-watch-template",
    external: true,
    classes: ["initiative-card", "card-garage"],
    category: "garage",
    tier: "garage",
    status: "coming-soon",
    line: "civic_tech",
    alsoOn: ["opioid_settlements"],
    audiences: ["community members"],
    tag: "civic-tech",
    titleHtml: "OPI + NBHRN Settlement Website Template",
    bodyHtml:
      "A template, built with the National Black Harm Reduction Network, for community organizations launching their own settlement accountability sites.",
    arrow: "See the prototype →",
  },
];
