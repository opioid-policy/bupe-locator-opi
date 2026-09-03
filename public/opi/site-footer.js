/* ==========================================================
   OPI Site Footer — single source of truth
   ----------------------------------------------------------
   Each HTML page includes:
     <footer id="site-footer"></footer>
     <script src="/js/site-footer.js" defer></script>
   This script replaces the placeholder with the canonical
   footer markup. Edit footer copy / links HERE only.
   ==========================================================*/

(function () {
    // Subdomain-safe base. On the canonical domain AND local dev, use
    // root-relative paths (so nav + assets resolve locally and on the main
    // site). On a Codeberg-Pages subdomain (settlementsifter., data-liberation.,
    // …) prefix in-house paths with the main domain so the shared footer +
    // subway map don't 404. External links (findbupe, news, stripe, codeberg)
    // stay absolute regardless. See SHARED-FOOTER-SYNC.md.
    const CANON = 'opioidpolicy.org';
    const h = location.hostname;
    const onCanon = h === CANON || h === 'www.' + CANON
        || h === 'localhost' || h === '127.0.0.1' || h === '';
    const BASE = onCanon ? '' : 'https://' + CANON;

    const footerHTML = `
<footer>
    <div class="footer-inner">
        <div class="footer-grid">
            <div class="footer-brand">
                <a href="${BASE}/" class="footer-logo-link" aria-label="Opioid Policy Institute home">
                    <picture>
                        <source media="(max-width: 768px)" srcset="/opi/images/opi-square-otter-transparent.png">
                        <img src="/opi/images/opi-wide-otters-transparent.png" alt="" class="footer-logo">
                    </picture>
                </a>
                <p>The Opioid Policy Institute works to improve outcomes for people affected by opioid addiction.</p>
            </div>

            <div class="footer-col">
                <h4>Projects</h4>
                <ul>
                    <li><a href="${BASE}/osm-settlements">Opioid Settlements Watchdog</a></li>
                    <li><a href="${BASE}/osm-accountability-hub#report-wfam">✱ Report WFAM</a></li>
                    <li><a href="${BASE}/addiction-privacy">Addiction Privacy</a></li>
                    <li><a href="${BASE}/privacy-consulting">Privacy Mutual Aid</a></li>
                    <li><a href="${BASE}/finding-treatment">Finding Treatment</a></li>
                    <li><a href="${BASE}/naloxone">Naloxone</a></li>
                    <li><a href="https://findbupe.org" target="_blank" rel="noopener">FindBupe↗</a></li>
                    <li><a href="${BASE}/projects" class="footer-projects-all">View all projects →</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Info</h4>
                <ul>
                    <li><a href="${BASE}/team">Team</a></li>
                    <li><a href="https://news.opioidpolicy.org" target="_blank" rel="noopener">News</a></li>
                    <li><a href="${BASE}/whitepapers">Whitepapers</a></li>
                    <li><a href="${BASE}/policy-briefs">Policy Briefs</a></li>
                    <li><a href="${BASE}/mission-approach">Mission &amp; Approach</a></li>
                    <li><a href="${BASE}/otters">Why Otters?</a></li>
                    <li><a href="${BASE}/privacy-policy">Privacy Policy</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Connect</h4>
                <ul>
                    <li><a href="${BASE}/contact">Contact</a></li>
                    <li><a href="https://news.opioidpolicy.org/#/portal/signup" target="_blank" rel="noopener">Subscribe</a></li>
                    <li><a href="https://donate.stripe.com/cN2g1p3jIdrw1W0cMM" target="_blank" rel="noopener">Support</a></li>
                    <li><a href="https://codeberg.org/opioidpolicy" target="_blank" rel="noopener" class="glitch-link" data-glitch="Codeberg ↗">Codeberg ↗</a></li>
                </ul>
            </div>
        </div>

        <p class="footer-cc">If you're citing our work, please credit the source and follow our <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">Creative Commons license</a>. <strong>Opioid Policy Institute</strong> by Jonathan JK Stoltman, PhD is licensed under CC BY-NC-SA 4.0.</p>

        <div class="footer-newsletter">
            <h4>Subscribe to OPI's newsletter</h4>
            <p>Get the latest research and policy updates delivered to your inbox.</p>
            <form class="newsletter-form footer-newsletter-form" id="footerNewsletterForm">
                <input type="email" name="email" placeholder="Email" required autocomplete="email" aria-label="Email address">
                <button type="submit" class="btn btn-primary">Subscribe</button>
                <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;">
            </form>
            <div class="newsletter-msg" id="footerNewsletterMsg" role="status" aria-live="polite"></div>
        </div>

        <div class="footer-subway-map">
            <span class="footer-subway-eyebrow">OPI Projects</span>
            <div class="subway-map" data-subway-map data-subway-map-size="mini" role="group" aria-label="Mini map of OPI projects"></div>
            <div class="subway-legend" data-subway-legend role="img" aria-label="Subway map legend"></div>
        </div>

        <div class="footer-bottom">
            <span class="footer-legal">© Opioid Policy Institute, LLC</span>
            <a class="footer-cli-egg" href="${BASE}/cli" aria-label="Open OPI command-line interface">&gt; opi cli</a>
            <span class="footer-motto">montani semper liberi</span>
        </div>
    </div>
</footer>
`;

    function injectFooter() {
        const placeholder = document.getElementById('site-footer');
        if (!placeholder) return;
        placeholder.outerHTML = footerHTML;

        // Newsletter submit — wired as a listener rather than an inline
        // onsubmit= attribute, so it survives a strict Content-Security-Policy
        // (script-src-attr blocks inline handlers; drugboatstrike.com enforces one).
        const nlForm = document.getElementById('footerNewsletterForm');
        if (nlForm) nlForm.addEventListener('submit', function (e) {
            return window.subscribeToGhost(e, 'footerNewsletterForm');
        });

        // Responsive Subscribe placement (CSS `order` can't cross the grid
        // boundary cleanly, so we reorder in the DOM at the breakpoint):
        //   • Mobile (≤768): Subscribe is its OWN grid row, right after the brand
        //     → footer stacks brand → Subscribe → columns (full centered box).
        //   • Desktop: Subscribe tucks INTO the brand column, under the tagline
        //     (compact arrow form, styled via `.footer-brand .footer-newsletter`).
        (function () {
            const grid = document.querySelector('.footer-grid');
            const nl = document.querySelector('.footer-newsletter');
            const brand = document.querySelector('.footer-brand');
            if (!grid || !nl || !brand) return;
            const mq = window.matchMedia('(max-width: 768px)');
            function place() {
                if (mq.matches) {
                    if (nl.parentNode !== grid) grid.insertBefore(nl, grid.querySelector('.footer-col'));
                } else if (nl.parentNode !== brand) {
                    brand.appendChild(nl);
                }
            }
            place();
            if (mq.addEventListener) mq.addEventListener('change', place);
            else if (mq.addListener) mq.addListener(place);
        })();

        // Tell the subway-map renderer to pick up the new mini-map container
        if (typeof window.OPI_renderSubwayMaps === 'function') {
            window.OPI_renderSubwayMaps();
        }

        // Inject the global floating buttons (back-to-top + customer support)
        // on every page EXCEPT /cli.html and /contact.html (where they're
        // redundant — CLI has its own [×] exit, contact IS the contact page).
        const skipFloating = /\/(cli|contact)\.html?$/i.test(location.pathname)
            || document.body.dataset.skipFloating === 'true';
        if (!skipFloating) {
            // Back-to-top arrow (bottom-right, scrolls page to top)
            if (!document.querySelector('.opi-back-to-top')) {
                const arrow = document.createElement('button');
                arrow.type = 'button';
                arrow.className = 'opi-back-to-top';
                arrow.setAttribute('aria-label', 'Back to top');
                arrow.innerHTML = '<span aria-hidden="true">&uarr;</span>';
                arrow.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                document.body.appendChild(arrow);
                // Show only after scrolling past 400px
                const scrollY = () => window.scrollY || window.pageYOffset
                    || (document.scrollingElement || document.documentElement || document.body).scrollTop || 0;
                const onScroll = () => {
                    arrow.classList.toggle('is-visible', scrollY() > 400);
                };
                // Listen on window AND capture document-level scroll so the arrow
                // still triggers if a mobile browser reports scroll on a different root.
                window.addEventListener('scroll', onScroll, { passive: true });
                document.addEventListener('scroll', onScroll, { passive: true, capture: true });
                onScroll();
            }
            // Customer-support button (stacked above the back-to-top arrow)
            if (!document.querySelector('.opi-support-btn')) {
                const btn = document.createElement('a');
                btn.className = 'opi-support-btn';
                btn.href = BASE + '/contact';
                btn.setAttribute('aria-label', 'Get in touch — contact OPI');
                btn.innerHTML = '<span class="opi-support-btn-icon" aria-hidden="true"></span><span class="opi-support-btn-tooltip">Get in touch</span>';
                document.body.appendChild(btn);
            }
        }

        // Stamp every form with a load timestamp for the server-side timing trap
        // (anti-spam to replace Turnstile — see _docs/anti-spam-no-turnstile.md).
        // PHP rejects submissions faster than a human could fill the form.
        var _ts = String(Date.now());
        document.querySelectorAll('form').forEach(function (f) {
            if (f.querySelector('input[name="_t"]')) return;
            var i = document.createElement('input');
            i.type = 'hidden'; i.name = '_t'; i.value = _ts;
            f.appendChild(i);
        });
    }

    // Shared, Turnstile-free newsletter submit. Defined here (this file is
    // deferred, so it OVERRIDES any older inline subscribeToGhost on the page).
    // Posts the form's FormData — email + honeypot `website` + `_t` timing —
    // to /api/subscribe.php (server-side → Ghost; no IP logging, no Turnstile).
    window.subscribeToGhost = async function (e, formId) {
        if (e && e.preventDefault) e.preventDefault();
        var form = document.getElementById(formId) || (e && e.target);
        if (!form) return false;
        var btn = form.querySelector('button[type="submit"]');
        // Convention: <id>Form pairs with <id>Msg (footerNewsletterForm →
        // footerNewsletterMsg, heroNewsletterForm → heroNewsletterMsg). Fall
        // back to any nearby .newsletter-msg, then the footer's.
        var msg = document.getElementById((formId || form.id || '').replace(/Form$/, 'Msg'))
            || (form.parentElement && form.parentElement.querySelector('.newsletter-msg'))
            || form.querySelector('.newsletter-msg')
            || document.getElementById('footerNewsletterMsg');
        function show(t, cls) { if (msg) { msg.textContent = t; msg.className = 'newsletter-msg ' + cls; } }
        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Subscribing…'; }
        try {
            var res = await fetch('/api/newsletter-signup', { method: 'POST', body: new FormData(form) });
            var data = await res.json().catch(function () { return {}; });
            if (res.ok && data.success) { show('✓ Thanks — check your inbox to confirm.', 'success'); form.reset(); }
            else { show(data.error || 'Something went wrong — please try again.', 'error'); }
        } catch (err) { show('Something went wrong — please try again.', 'error'); }
        finally { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Subscribe'; } }
        return false;
    };
    // Legacy Turnstile callback kept as a no-op so old inline references can't throw.
    if (typeof window.onTurnstileSuccess !== 'function') window.onTurnstileSuccess = function () {};

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        injectFooter();
    }
})();
