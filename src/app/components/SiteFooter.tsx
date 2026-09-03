// src/app/components/SiteFooter.tsx
"use client";
import { memo, useEffect } from 'react';

// The canonical OPI footer. The three scripts are the main site's own chrome,
// vendored into public/opi/ at build time by scripts/sync-opi-chrome.mjs, so
// the browser never contacts opioidpolicy.org:
//   site-footer.js   replaces #site-footer with the shared footer markup
//   projects-data.js + subway-map.js  draw the "OPI Projects" mini subway map
const VERSION = process.env.NEXT_PUBLIC_CHROME_V ?? '0';
const SCRIPTS = ['/opi/site-footer.js', '/opi/projects-data.js', '/opi/subway-map.js'];

function loadSequentially(srcs: string[]): void {
  const [first, ...rest] = srcs;
  if (!first) return;
  const src = `${first}?v=${VERSION}`;
  if (document.querySelector(`script[src="${src}"]`)) {
    loadSequentially(rest);
    return;
  }
  const el = document.createElement('script');
  el.src = src;
  el.async = false;
  el.onload = () => loadSequentially(rest);
  document.body.appendChild(el);
}

function SiteFooter() {
  useEffect(() => {
    // Keep the app's own floating controls (language selector); the chrome
    // would otherwise inject its own buttons in the same corner.
    document.body.dataset.skipFloating = 'true';
    loadSequentially(SCRIPTS);
  }, []);

  // site-footer.js swaps the placeholder for the real footer. The #opi-chrome
  // wrapper lets globals.css keep its reset away from the injected markup.
  // This component is memoized with no props, so React never reconciles the
  // replaced node again.
  return (
    <div id="opi-chrome" suppressHydrationWarning>
      <div id="site-footer" />
    </div>
  );
}

export default memo(SiteFooter);
