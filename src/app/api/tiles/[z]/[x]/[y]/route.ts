// src/app/api/tiles/[z]/[x]/[y]/route.ts
// Map tile proxy. The browser only ever talks to findbupe.org; this route
// fetches the basemap tile from CARTO with our server's IP and a fixed
// User-Agent, so the tile provider never sees the visitor or a referrer.
// Responses are cached at the CDN (s-maxage), so most tiles never invoke
// this function twice.
//
// CARTO raster basemaps require a free API key (fair use: 5M tiles/month,
// non-profits welcome): https://carto.com/basemaps/apikey . Set it as
// CARTO_BASEMAP_KEY in the environment. Without it, tiles still load but
// carry an "API KEY REQUIRED" watermark.
import { NextResponse } from 'next/server';

const STYLE = 'dark_all';
const SUBDOMAINS = ['a', 'b', 'c', 'd'];
const MAX_ZOOM = 20;
const INT_RE = /^\d{1,7}$/;
const TILE_RE = /^(\d{1,7})(@2x)?\.png$/;
const UPSTREAM_TIMEOUT_MS = 8_000;

export async function GET(
  _request: Request,
  context: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await context.params;
  const m = TILE_RE.exec(y);
  if (!INT_RE.test(z) || !INT_RE.test(x) || !m) {
    return new NextResponse('Bad tile', { status: 400 });
  }

  const zoom = Number(z);
  const col = Number(x);
  const row = Number(m[1]);
  const retina = m[2] ?? '';
  const max = 2 ** zoom;
  if (zoom > MAX_ZOOM || col >= max || row >= max) {
    return new NextResponse('Bad tile', { status: 400 });
  }

  const sub = SUBDOMAINS[(col + row) % SUBDOMAINS.length];
  const key = process.env.CARTO_BASEMAP_KEY;
  const upstream =
    `https://${sub}.basemaps.cartocdn.com/${STYLE}/${zoom}/${col}/${row}${retina}.png` +
    (key ? `?key=${encodeURIComponent(key)}` : '');

  try {
    const res = await fetch(upstream, {
      headers: {
        'User-Agent': 'FindBupe/3.0 (+https://findbupe.org)',
        'Accept': 'image/png,image/*;q=0.8',
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse('Tile unavailable', { status: 502 });
    }

    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        // Browser: 1 day. CDN: 30 days. Tiles are effectively immutable.
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Tile unavailable', { status: 502 });
  }
}
