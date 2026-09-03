#!/usr/bin/env node
// scripts/sync-opi-chrome.mjs
// ------------------------------------------------------------------
// Vendors the shared OPI site chrome (canonical footer + subway map +
// design-system CSS + the two logo images) from opioidpolicy.org into
// public/opi/ at BUILD time. Visitors never contact opioidpolicy.org:
// everything is served from findbupe.org, which keeps the strict
// same-origin CSP and the "no IP logs" promise intact, while the footer
// still re-syncs with the main site on every deploy.
//
// Runs as `prebuild`. Behaviour:
//   - network failure  -> warn and keep the committed copy (build continues)
//   - upstream changed shape (a rewrite marker no longer matches exactly)
//                      -> FAIL the build loudly, never ship a broken footer
// ------------------------------------------------------------------
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ORIGIN = 'https://opioidpolicy.org';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'opi');
const TIMEOUT_MS = 15_000;

/** @type {Array<{src:string, dest:string, binary?:boolean, wrap?:(s:string)=>string, rewrites?:Array<[string,string,number]>}>} */
const FILES = [
  {
    src: '/js/site-footer.js',
    dest: 'site-footer.js',
    rewrites: [
      // logo images -> local copies
      ['${BASE}/images/', '/opi/images/', 2],
      // newsletter form -> our own API (same origin, honeypot + timing checked there)
      ["BASE + '/api/subscribe.php'", "'/api/newsletter-signup'", 1],
    ],
  },
  { src: '/js/projects-data.js', dest: 'projects-data.js' },
  { src: '/js/subway-map.js', dest: 'subway-map.js' },
  {
    src: '/css/global.css',
    dest: 'global.css',
    rewrites: [["url('/images/custy-support.webp')", "url('/opi/images/custy-support.webp')", 1]],
    // Cascade layer: the app's own (unlayered) CSS always wins over the chrome CSS.
    wrap: (css) => `/* Vendored from ${ORIGIN}/css/global.css by scripts/sync-opi-chrome.mjs. Do not edit. */\n@layer opi {\n${css}\n}\n`,
  },
  { src: '/images/opi-wide-otters-transparent.png', dest: 'images/opi-wide-otters-transparent.png', binary: true },
  { src: '/images/opi-square-otter-transparent.png', dest: 'images/opi-square-otter-transparent.png', binary: true },
  { src: '/images/custy-support.webp', dest: 'images/custy-support.webp', binary: true },
];

const exists = (p) => access(p).then(() => true, () => false);

function countOccurrences(haystack, needle) {
  let n = 0, i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

async function fetchOne(src, binary) {
  const res = await fetch(ORIGIN + src, {
    headers: { 'User-Agent': 'FindBupe build (sync-opi-chrome)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
}

let refreshed = 0, kept = 0;
for (const f of FILES) {
  const dest = path.join(OUT_DIR, f.dest);
  await mkdir(path.dirname(dest), { recursive: true });

  let body;
  try {
    body = await fetchOne(f.src, f.binary);
  } catch (err) {
    if (await exists(dest)) {
      console.warn(`[sync-opi-chrome] WARN could not fetch ${f.src} (${err.message}); keeping committed copy`);
      kept++;
      continue;
    }
    console.error(`[sync-opi-chrome] ERROR could not fetch ${f.src} and no committed copy exists`);
    process.exit(1);
  }

  if (!f.binary) {
    for (const [from, to, expected] of f.rewrites ?? []) {
      const n = countOccurrences(body, from);
      if (n !== expected) {
        console.error(
          `[sync-opi-chrome] ERROR ${f.src}: expected ${expected} occurrence(s) of ${JSON.stringify(from)}, found ${n}.\n` +
          `  The upstream file changed shape. Update the rewrite table in scripts/sync-opi-chrome.mjs.`
        );
        process.exit(1);
      }
      body = body.split(from).join(to);
    }
    if (f.wrap) body = f.wrap(body);
    // Belt and braces: the vendored chrome must never point the browser at another origin.
    const stray = body.match(/https?:\/\/(?!opioidpolicy\.org|news\.opioidpolicy\.org|findbupe\.org|donate\.stripe\.com|codeberg\.org|creativecommons\.org|www\.w3\.org)[a-z0-9.-]+/gi);
    if (stray && f.dest.endsWith('.css')) {
      console.error(`[sync-opi-chrome] ERROR ${f.src} references unexpected external hosts: ${[...new Set(stray)].join(', ')}`);
      process.exit(1);
    }
  }

  const previous = (await exists(dest)) ? await readFile(dest) : null;
  const next = f.binary ? body : Buffer.from(body, 'utf8');
  if (previous && previous.equals(next)) {
    kept++;
  } else {
    await writeFile(dest, next);
    refreshed++;
  }
}

console.log(`[sync-opi-chrome] done: ${refreshed} file(s) refreshed, ${kept} unchanged/kept -> public/opi/`);
