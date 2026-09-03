/* ==========================================================
   OPI Subway Map — SVG renderer
   ----------------------------------------------------------
   Renders an interactive subway-style map of OPI projects from
   /js/projects-data.js into any container marked:
     <div class="subway-map" data-subway-map data-subway-map-size="full|mini"></div>

   Lines radiate from a central "Home" hub at 6 cardinal angles
   (one line per topic). Each station = one project. Stations on
   the same `line` are placed sequentially outward from the hub.
   `alsoOn` projects get colored interchange rings around the
   station to indicate secondary topics. `status: 'coming-soon'`
   stations render with a dashed line (used for garage projects).

   Interactivity:
   - Hover/focus a station → its line lights up, others dim,
     label expands and turns OPI green.
   - Click a station → navigate to project.href (external opens
     in new tab).
   - Audience filter (full map only) → dims stations that don't
     match the selected audience.

   Public API:
   - window.OPI_renderSubwayMaps()  — re-render all maps. Called
     by /js/site-footer.js after footer markup is injected.
   ==========================================================*/
(function () {
    /* Line geometry. SVG angles use Y-down coords:
       0° = east (+x), 90° = south (+y), 180° = west (-x), 270° = north (-y).

       Each line has one or more `segments`. The line emerges from the hub
       at the first segment's angle, places `length` stations along it,
       then bends to the next segment's angle. This keeps long lines
       compact (e.g. opioid_settlements has 11 stations — split between
       south, east, and a bit of north so it doesn't run off-screen). */
    const LINES = {
        // Settlements (light-purple) — 6 stations, runs east + bends south
        // so it can keep its turn without dominating the layout
        opioid_settlements: {
            color: '#ccccff', label: 'Settlements',
            segments: [
                { angle: 0,  length: 3 },    // east
                { angle: 90, length: 4 }     // bend south (room for up to 4 stations)
            ]
        },
        advocacy: {
            color: '#f71824', label: 'Advocacy',
            segments: [
                { angle: 135, length: 3 },   // southwest (naloxone, settlement-roadmap, nj-watch)
                { angle: 90,  length: 2 }     // dog-leg straight down (nopvee, drug-boat-strike) so the line stays compact
            ]
        },
        privacy: {
            color: '#00ff85', label: 'Privacy',
            segments: [
                { angle: 225, length: 4 }    // northwest
            ]
        },
        research: {
            color: '#fdc919', label: 'Research',
            segments: [
                { angle: 315, length: 5 }    // northeast (5 stations: find-treatment, reporting-on-addiction, newsletter, unallowable-whitepaper, ag-whitepaper)
            ]
        },
        civic_tech: {
            color: '#ff580f', label: 'Civic Tech',
            segments: [
                { angle: 270, length: 8 }    // north (was south; moved to north slot now that treatment line is retired). Headroom: segment length only caps how many stations can be PLACED, so a larger number costs nothing visually.
            ]
        }
    };

    const SIZE_CONFIG = {
        full: {
            width: 720, height: 480,
            stationSpacing: 48, stationRadius: 7,
            hubRadius: 12, lineWidth: 3.5,
            haloWidth: 5,                   // research line halo
            interchangeRingGap: 3, interchangeRingWidth: 2,
            labelFontSize: 12, labelOffset: 16,
            lineLabelFontSize: 11, lineLabelOffset: 38,   // bigger + farther so it doesn't sit on the line
            labelPadX: 7, labelPadY: 4
        },
        mini: {
            width: 380, height: 240,
            stationSpacing: 36, stationRadius: 5.5,
            hubRadius: 10, lineWidth: 3,
            haloWidth: 5,
            interchangeRingGap: 2, interchangeRingWidth: 1.5,
            labelFontSize: 10, labelOffset: 10,
            lineLabelFontSize: 0, lineLabelOffset: 0,   // mini hides line labels
            labelPadX: 5, labelPadY: 3
        }
    };

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function createSvgEl(name, attrs) {
        const el = document.createElementNS(SVG_NS, name);
        if (attrs) {
            for (const k in attrs) {
                if (attrs[k] === null || attrs[k] === undefined) continue;
                el.setAttribute(k, attrs[k]);
            }
        }
        return el;
    }

    function angleToRad(deg) { return (deg * Math.PI) / 180; }

    /* Group projects by primary line and assign each one an outward index.
       Live stations placed first; coming-soon at the outer edge. The Home
       hub is excluded (rendered separately as the center). */
    function groupStations(data) {
        const groups = {};
        for (const key in LINES) groups[key] = [];
        data.forEach(p => {
            if (!p.line || p.line === 'hub') return;
            if (p.cardOnly) return;            // card-only entries skip the map
            if (!groups[p.line]) return;       // unknown line — skip
            groups[p.line].push(p);
        });
        // Sort: live stations innermost, coming-soon at the end of each line
        for (const key in groups) {
            groups[key].sort((a, b) => {
                const aSoon = a.status === 'coming-soon' ? 1 : 0;
                const bSoon = b.status === 'coming-soon' ? 1 : 0;
                return aSoon - bSoon;
            });
        }
        return groups;
    }

    function findHub(data) {
        return data.find(p => p.line === 'hub') || null;
    }

    function audiencesAttr(audiences) {
        if (!Array.isArray(audiences)) return '';
        return audiences.join('|');
    }

    /* Walk a line's segments and place stations along the path. Returns an
       array of {x, y, angle} relative to the hub (0,0). The angle is the
       segment direction the station was placed along — used for label
       placement. */
    function computeStationPositions(lineDef, stationCount, spacing) {
        const positions = [];
        let x = 0, y = 0;
        let placed = 0;
        const segs = lineDef.segments || [{ angle: lineDef.angle || 0, length: stationCount }];
        for (const seg of segs) {
            if (placed >= stationCount) break;
            const rad = angleToRad(seg.angle);
            const dx = Math.cos(rad) * spacing;
            const dy = Math.sin(rad) * spacing;
            const segMax = Math.min(seg.length, stationCount - placed);
            for (let i = 0; i < segMax; i++) {
                x += dx;
                y += dy;
                positions.push({ x, y, angle: seg.angle });
                placed++;
            }
        }
        // Overflow guard: if a line has MORE stations than its segments can hold,
        // keep extending along the last segment's angle. Without this, positions[]
        // came up short, positions[i] was undefined, and reading .x threw — which
        // killed the ENTIRE map (footer mini-map site-wide + the full map) the
        // moment someone added one project too many to a line.
        if (placed < stationCount) {
            const last = segs[segs.length - 1] || { angle: lineDef.angle || 0 };
            const rad = angleToRad(last.angle);
            const dx = Math.cos(rad) * spacing;
            const dy = Math.sin(rad) * spacing;
            while (placed < stationCount) {
                x += dx;
                y += dy;
                positions.push({ x, y, angle: last.angle });
                placed++;
            }
        }
        return positions;
    }

    /* Compute SVG dimensions based on actual station positions across all
       segments. Returns { width, height, cx, cy }. */
    function computeDimensions(data, cfg) {
        const groups = groupStations(data);
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        for (const lineKey in LINES) {
            const stations = groups[lineKey];
            if (!stations || !stations.length) continue;
            const lineDef = LINES[lineKey];
            const positions = computeStationPositions(lineDef, stations.length, cfg.stationSpacing);
            const labelPad = cfg.labelOffset + 80;   // generous label-text width estimate
            positions.forEach(p => {
                if (p.x - labelPad < minX) minX = p.x - labelPad;
                if (p.x + labelPad > maxX) maxX = p.x + labelPad;
                if (p.y - 30 < minY) minY = p.y - 30;
                if (p.y + 30 > maxY) maxY = p.y + 30;
            });
        }
        const padding = 30;
        const width = Math.max((maxX - minX) + padding * 2, 320);
        const height = Math.max((maxY - minY) + padding * 2, 220);
        return {
            width,
            height,
            cx: -minX + padding,
            cy: -minY + padding
        };
    }

    function renderMap(container) {
        const data = window.OPI_PROJECTS;
        if (!Array.isArray(data)) return;

        const size = container.dataset.subwayMapSize === 'mini' ? 'mini' : 'full';
        const cfg = SIZE_CONFIG[size];
        const dims = computeDimensions(data, cfg);
        const cx = dims.cx;
        const cy = dims.cy;

        // Wipe existing content (re-render-safe)
        container.textContent = '';

        const svg = createSvgEl('svg', {
            viewBox: `0 0 ${dims.width} ${dims.height}`,
            width: '100%',
            preserveAspectRatio: 'xMidYMid meet',
            role: 'img'
        });

        // Layer groups so we can control z-order: lines under stations under labels
        const linesLayer = createSvgEl('g', { class: 'subway-lines-layer' });
        const stationsLayer = createSvgEl('g', { class: 'subway-stations-layer' });
        const labelsLayer = createSvgEl('g', { class: 'subway-labels-layer' });
        svg.appendChild(linesLayer);
        svg.appendChild(stationsLayer);
        svg.appendChild(labelsLayer);

        const groups = groupStations(data);
        const hub = findHub(data);

        // Track all rendered <g class="subway-station"> elements for filter logic
        const stationEls = [];
        // Track all <line> elements grouped by line key for highlight logic
        const lineEls = {};
        for (const key in LINES) lineEls[key] = [];

        for (const lineKey in LINES) {
            const lineDef = LINES[lineKey];
            const stations = groups[lineKey];
            if (!stations || !stations.length) continue;

            // Walk segments to get one position per station (relative to hub)
            const positions = computeStationPositions(lineDef, stations.length, cfg.stationSpacing);

            // Halo line (only for halo lines): a single polyline tracing the path
            if (lineDef.halo) {
                const points = [`${cx},${cy}`].concat(
                    positions.map(p => `${cx + p.x},${cy + p.y}`)
                );
                const halo = createSvgEl('polyline', {
                    points: points.join(' '),
                    fill: 'none',
                    stroke: '#F2F1E8',
                    'stroke-width': cfg.haloWidth,
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    class: 'subway-line-halo',
                    'data-line-id': lineKey
                });
                linesLayer.appendChild(halo);
            }

            // Per-station line segments so coming-soon ones can dash individually
            let prevX = cx, prevY = cy;
            stations.forEach((station, i) => {
                const pos = positions[i];
                const sx = cx + pos.x;
                const sy = cy + pos.y;
                const seg = createSvgEl('line', {
                    x1: prevX, y1: prevY,
                    x2: sx, y2: sy,
                    stroke: lineDef.color,
                    'stroke-width': cfg.lineWidth,
                    'stroke-linecap': 'round',
                    class: 'subway-line',
                    'data-line-id': lineKey
                });
                if (station.status === 'coming-soon') {
                    seg.setAttribute('stroke-dasharray', '6 4');
                }
                linesLayer.appendChild(seg);
                lineEls[lineKey].push(seg);
                prevX = sx; prevY = sy;
            });

            // Line label past the last station, continuing along its segment direction
            if (cfg.lineLabelFontSize > 0 && positions.length) {
                const lastPos = positions[positions.length - 1];
                const rad = angleToRad(lastPos.angle);
                const lx = cx + lastPos.x + Math.cos(rad) * cfg.lineLabelOffset;
                const ly = cy + lastPos.y + Math.sin(rad) * cfg.lineLabelOffset;
                const lineLabel = createSvgEl('text', {
                    x: lx, y: ly,
                    fill: lineDef.color,
                    'font-size': cfg.lineLabelFontSize,
                    'font-family': 'var(--font-mono), monospace',
                    'font-weight': 700,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    class: 'subway-line-label',
                    'data-line-id': lineKey
                });
                lineLabel.textContent = lineDef.label.toUpperCase();
                labelsLayer.appendChild(lineLabel);
            }

            // Stations
            stations.forEach((station, i) => {
                const pos = positions[i];
                const sx = cx + pos.x;
                const sy = cy + pos.y;
                const segRad = angleToRad(pos.angle);
                const dx = Math.cos(segRad);
                const dy = Math.sin(segRad);

                const alsoOnStr = Array.isArray(station.alsoOn) ? station.alsoOn.join('|') : '';
                const groupAttrs = {
                    class: 'subway-station',
                    transform: `translate(${sx}, ${sy})`,
                    'data-line-id': lineKey,
                    'data-also-on': alsoOnStr,
                    'data-status': station.status || 'live',
                    'data-audiences': audiencesAttr(station.audiences),
                    'data-href': station.href || '',
                    'data-external': station.external ? 'true' : 'false',
                    tabindex: '0',
                    role: 'link'
                };
                const ariaLabel = (() => {
                    // Prefer mapLabel (clean text for the map) over titleHtml
                    // (which may carry card-specific HTML/CLI styling that
                    // strips to a weird label like a shell command).
                    const name = station.mapLabel || (station.titleHtml ? station.titleHtml.replace(/<[^>]+>/g, '') : station.id);
                    const status = station.status === 'coming-soon' ? ', coming soon' : '';
                    return `${name}, on the ${lineDef.label} line${status}`;
                })();
                groupAttrs['aria-label'] = ariaLabel;
                const g = createSvgEl('g', groupAttrs);

                // Outer interchange rings (one per alsoOn line)
                if (Array.isArray(station.alsoOn)) {
                    station.alsoOn.forEach((altKey, ringIdx) => {
                        const altDef = LINES[altKey];
                        if (!altDef) return;
                        const ringR = cfg.stationRadius + cfg.interchangeRingGap + ringIdx * (cfg.interchangeRingWidth + 1.5);
                        const ring = createSvgEl('circle', {
                            cx: 0, cy: 0,
                            r: ringR,
                            fill: 'none',
                            stroke: altDef.color,
                            'stroke-width': cfg.interchangeRingWidth,
                            'data-line-id': altKey,
                            class: 'subway-station-interchange'
                        });
                        g.appendChild(ring);
                    });
                }

                // Primary station circle
                const circle = createSvgEl('circle', {
                    cx: 0, cy: 0,
                    r: cfg.stationRadius,
                    fill: station.status === 'coming-soon' ? 'var(--color-black)' : lineDef.color,
                    stroke: lineDef.color,
                    'stroke-width': station.status === 'coming-soon' ? 2 : 1.5,
                    'stroke-dasharray': station.status === 'coming-soon' ? '3 2' : null
                });
                g.appendChild(circle);

                stationsLayer.appendChild(g);
                stationEls.push(g);

                // Label sits in a <g> with a background pill rect behind the
                // text. Pill ensures legibility when the label overlays a line
                // on hover. Group is hidden at rest (opacity 0) and revealed
                // on hover. Position offset perpendicular-outward from the
                // hub so it doesn't sit on top of the next station.
                // Prefer mapLabel (clean text) over titleHtml-stripped — the
                // addiction-privacy card uses CLI-styled HTML for titleHtml
                // which doesn't make sense as a station label.
                const name = station.mapLabel || (station.titleHtml ? station.titleHtml.replace(/<[^>]+>/g, '') : station.id);
                // No truncation — pill grows to fit full name (hover-only so width is OK)
                const displayName = name;
                // Perpendicular-outward direction: 90° from line, side that points away from hub
                const cwX = Math.cos(segRad + Math.PI / 2);
                const cwY = Math.sin(segRad + Math.PI / 2);
                const ccwX = Math.cos(segRad - Math.PI / 2);
                const ccwY = Math.sin(segRad - Math.PI / 2);
                // Pick the perpendicular pointing away from origin (hub at cx,cy in svg coords; pos.x,pos.y relative to hub)
                const cwOutward = cwX * pos.x + cwY * pos.y;
                const useOutwardCw = cwOutward >= 0;
                const labelDirX = useOutwardCw ? cwX : ccwX;
                const labelDirY = useOutwardCw ? cwY : ccwY;
                const labelOffset = cfg.labelOffset + cfg.stationRadius;
                const labelCx = sx + labelDirX * labelOffset;
                const labelCy = sy + labelDirY * labelOffset;

                // Approximate text width (mono font; one char ≈ 0.6 × font-size)
                const charW = cfg.labelFontSize * 0.6;
                const textW = displayName.length * charW;
                const padX = cfg.labelPadX;
                const padY = cfg.labelPadY;
                const rectW = textW + padX * 2;
                const rectH = cfg.labelFontSize + padY * 2;

                const labelGroup = createSvgEl('g', {
                    'data-station-id': station.id,
                    'data-line-id': lineKey,
                    class: 'subway-station-label-group'
                });
                const rect = createSvgEl('rect', {
                    x: labelCx - rectW / 2,
                    y: labelCy - rectH / 2,
                    width: rectW,
                    height: rectH,
                    rx: 4, ry: 4,
                    fill: 'var(--color-black)',
                    class: 'subway-station-label-bg'
                });
                const label = createSvgEl('text', {
                    x: labelCx,
                    y: labelCy,
                    'font-size': cfg.labelFontSize,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    class: 'subway-station-label'
                });
                label.textContent = displayName;
                labelGroup.appendChild(rect);
                labelGroup.appendChild(label);
                labelsLayer.appendChild(labelGroup);

                // Link station element to label-group for hover-driven label state
                g.dataset.labelId = station.id;
            });
        }

        // Hub at center
        if (hub) {
            const hubG = createSvgEl('g', {
                class: 'subway-station subway-station-hub',
                transform: `translate(${cx}, ${cy})`,
                'data-line-id': 'hub',
                'data-href': hub.href || '/',
                'data-audiences': audiencesAttr(hub.audiences),
                tabindex: '0',
                role: 'link',
                'aria-label': 'Home — opioidpolicy.org'
            });
            const hubCircle = createSvgEl('circle', {
                cx: 0, cy: 0,
                r: cfg.hubRadius,
                fill: 'var(--color-strong-green)',
                stroke: 'var(--color-black)',
                'stroke-width': 2
            });
            hubG.appendChild(hubCircle);
            // No HOME text on the hub itself — the green circle speaks for
            // itself. On hover, a "Home" pill label appears below it.
            stationsLayer.appendChild(hubG);
            stationEls.push(hubG);

            // Hover label for the hub
            const hubLabelText = 'Home';
            const hubLabelCx = cx;
            const hubLabelCy = cy + cfg.hubRadius + 6 + cfg.labelFontSize / 2;
            const hubCharW = cfg.labelFontSize * 0.6;
            const hubRectW = hubLabelText.length * hubCharW + cfg.labelPadX * 2;
            const hubRectH = cfg.labelFontSize + cfg.labelPadY * 2;
            const hubLabelGroup = createSvgEl('g', {
                'data-station-id': 'home',
                'data-line-id': 'hub',
                class: 'subway-station-label-group'
            });
            const hubRect = createSvgEl('rect', {
                x: hubLabelCx - hubRectW / 2,
                y: hubLabelCy - hubRectH / 2,
                width: hubRectW,
                height: hubRectH,
                rx: 4, ry: 4,
                fill: 'var(--color-black)',
                class: 'subway-station-label-bg'
            });
            const hubText = createSvgEl('text', {
                x: hubLabelCx, y: hubLabelCy,
                'font-size': cfg.labelFontSize,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: 'subway-station-label'
            });
            hubText.textContent = hubLabelText;
            hubLabelGroup.appendChild(hubRect);
            hubLabelGroup.appendChild(hubText);
            labelsLayer.appendChild(hubLabelGroup);
            hubG.dataset.labelId = 'home';
        }

        container.appendChild(svg);

        wireInteractivity(container, svg, stationEls, lineEls);
    }

    function wireInteractivity(container, svg, stationEls, lineEls) {
        function activate(stationG) {
            const lineId = stationG.dataset.lineId;
            const alsoOnStr = stationG.dataset.alsoOn || '';
            const activeLines = new Set([lineId]);
            if (alsoOnStr) alsoOnStr.split('|').filter(Boolean).forEach(k => activeLines.add(k));
            container.classList.add('is-hovering');
            stationG.classList.add('is-hovered');
            // Highlight all stations + line segments matching activeLines
            stationEls.forEach(s => {
                if (activeLines.has(s.dataset.lineId)) s.classList.add('is-line-active');
            });
            for (const k in lineEls) {
                if (activeLines.has(k)) lineEls[k].forEach(l => l.classList.add('is-line-active'));
            }
            // Label highlight (group has both rect + text)
            const id = stationG.dataset.labelId;
            if (id) {
                const lbl = svg.querySelector(`.subway-station-label-group[data-station-id="${id}"]`);
                if (lbl) lbl.classList.add('is-hovered');
            }
        }

        function deactivate() {
            container.classList.remove('is-hovering');
            stationEls.forEach(s => { s.classList.remove('is-hovered'); s.classList.remove('is-line-active'); });
            for (const k in lineEls) lineEls[k].forEach(l => l.classList.remove('is-line-active'));
            svg.querySelectorAll('.subway-station-label-group.is-hovered').forEach(l => l.classList.remove('is-hovered'));
        }

        stationEls.forEach(g => {
            g.addEventListener('mouseenter', () => activate(g));
            g.addEventListener('mouseleave', () => deactivate());
            g.addEventListener('focus', () => activate(g));
            g.addEventListener('blur', () => deactivate());

            const navigate = () => {
                let href = g.dataset.href;
                if (!href || href === '#') return;
                // Subdomain-safe: the footer mini-map renders on Codeberg-Pages
                // subdomains too, where a root-relative project link (/naloxone)
                // would 404. Point in-house links back at the main domain there.
                if (href.charAt(0) === '/') {
                    var hn = location.hostname;
                    if (!(hn === 'opioidpolicy.org' || hn === 'www.opioidpolicy.org'
                          || hn === 'localhost' || hn === '127.0.0.1' || hn === '')) {
                        href = 'https://opioidpolicy.org' + href;
                    }
                }
                // Open in new tab when (a) the station is marked external, or
                // (b) the map is being rendered at full size — full-size maps
                // are the inline page widgets (e.g. mission-approach) where the
                // user is exploring projects and shouldn't lose their place.
                // The footer mini-map keeps same-window behavior.
                const isFullSize = container.dataset.subwayMapSize === 'full';
                if (g.dataset.external === 'true' || isFullSize) {
                    window.open(href, '_blank', 'noopener');
                } else {
                    window.location.href = href;
                }
            };
            g.addEventListener('click', navigate);
            g.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate();
                }
            });
        });

    }

    /* Render the legend into any [data-subway-legend] container. The legend
       lists each line color + label, plus the coming-soon (dashed) and
       interchange-ring patterns. Same component used on the projects page
       and in the footer. */
    function renderLegend(container) {
        container.textContent = '';
        for (const lineKey in LINES) {
            const lineDef = LINES[lineKey];
            const item = document.createElement('span');
            item.className = 'subway-legend-item';
            const swatch = document.createElement('span');
            swatch.className = 'subway-legend-swatch';
            swatch.style.background = lineDef.color;
            if (lineDef.halo) swatch.classList.add('subway-legend-halo');
            const label = document.createElement('span');
            label.className = 'subway-legend-label';
            label.textContent = lineDef.label;
            item.appendChild(swatch);
            item.appendChild(label);
            container.appendChild(item);
        }
        // Coming-soon swatch (dashed bar)
        const comingSoon = document.createElement('span');
        comingSoon.className = 'subway-legend-item';
        const csSwatch = document.createElement('span');
        csSwatch.className = 'subway-legend-swatch subway-legend-dashed';
        const csLabel = document.createElement('span');
        csLabel.className = 'subway-legend-label';
        csLabel.textContent = 'Coming soon';
        comingSoon.appendChild(csSwatch);
        comingSoon.appendChild(csLabel);
        container.appendChild(comingSoon);
    }

    function renderAll() {
        const mapContainers = document.querySelectorAll('[data-subway-map]');
        mapContainers.forEach(c => renderMap(c));
        const legendContainers = document.querySelectorAll('[data-subway-legend]');
        legendContainers.forEach(c => renderLegend(c));
    }

    // Public API for site-footer.js to call after injecting markup
    window.OPI_renderSubwayMaps = renderAll;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAll);
    } else {
        renderAll();
    }
})();
