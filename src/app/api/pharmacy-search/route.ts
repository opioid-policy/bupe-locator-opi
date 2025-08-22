// src/app/api/pharmacy-search/route.ts
import { NextResponse } from 'next/server';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';

interface NominatimSearchResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    shop?: string;
    amenity?: string;
    name?: string;
    town?: string;
    village?: string;
  };
  extratags?: {
    phone?: string;
    'contact:phone'?: string;
    brand?: string;
    operator?: string;
    'brand:wikidata'?: string;
  };
}

interface SearchSuggestion {
  name: string;
  osm_id: string;
  full_address: string;
}

// Constants
const PHARMACY_KEYWORDS = new Set([
  'pharmacy', 'drug store', 'apothecary', 'chemist',
  'cvs', 'walgreens', 'rite aid', 'duane reade',
  'medicine shoppe', 'healthmart', 'genoa', 'capsule',
  'walmart', 'wal-mart', 'target', 'kroger', 'safeway', 'albertsons',
  'vons', 'pavilions', 'randalls', 'tom thumb', 'acme',
  'jewel-osco', 'shaw\'s', 'star market', 'meijer',
  'publix', 'wegmans', 'h-e-b', 'heb', 'hy-vee', 'giant',
  'giant eagle', 'stop & shop', 'harris teeter', 'food lion',
  'fred meyer', 'qfc', 'smith\'s', 'king soopers', 'city market',
  'fry\'s', 'ralphs', 'dillons', 'baker\'s', 'gerbes',
  'pick \'n save', 'metro market', 'mariano\'s', 'whole foods',
  'sam\'s club', 'costco', 'bj\'s', 'price chopper', 'market basket',
  'shoprite', 'winn-dixie', 'ingles', 'food city', 'brookshire\'s',
  'united supermarkets', 'market street', 'amigos', 'albertsons market',
  'carrs', 'pavilions', 'tom thumb', 'united', 'randalls',
  'jewel', 'osco', 'sav-on', 'star', 'shaws', 'hannaford',
  'price rite', 'tops', 'weis', 'giant food stores', 'martin\'s',
  'food giant', 'piggly wiggly', 'bi-lo', 'harveys', 'fresco y más'
]);

// 15 miles in degrees (~0.2 for latitude, ~0.2 for longitude at mid-latitudes)
const BOUNDING_BOX_DELTA = 0.2;
// ~500m in degrees (~0.005)

// Token bucket rate limiter
class TokenBucket {
  private capacity: number;
  private tokens: number;
  private lastRefill: number;
  private refillRate: number; // tokens per second

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.refillRate = refillRate;
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // in seconds
    const newTokens = timePassed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// Global rate limiter using token bucket
const globalRateLimiter = new TokenBucket(10, 10); // 10 requests per second

// Cache with hashed keys
const searchCache = new NodeCache({ stdTTL: 7200 });
const detailsCache = new NodeCache({ stdTTL: 86400 });

// Input sanitization
function sanitizeInput(query: string): string {
  return query.replace(/[^\w\s\-(),.]/g, '').substring(0, 100);
}

// Coordinate validation
function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Generate privacy-preserving cache key
function generateCacheKey(...parts: string[]): string {
  return createHash('sha256')
    .update(parts.join('_'))
    .digest('hex')
    .substring(0, 16);
}

// Simplified pharmacy name extraction
function getPharmacyName(result: NominatimSearchResult): string {
  return (result.address?.name ||
          result.address?.shop ||
          result.address?.amenity ||
          result.extratags?.brand ||
          result.display_name.split(',')[0]).trim().toLowerCase();
}

// Simplified deduplication using spatial indexing
function deduplicatePharmacies(results: NominatimSearchResult[]): NominatimSearchResult[] {
  const seen = new Map<string, NominatimSearchResult>();
  const locationIndex = new Map<string, boolean>();

  for (const result of results) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const geoKey = `${Math.floor(lat * 1000)},${Math.floor(lon * 1000)}`;
    const name = getPharmacyName(result);

    if (!locationIndex.has(geoKey)) {
      locationIndex.set(geoKey, true);
      seen.set(`${geoKey}-${name}`, result);
    }
  }

  return Array.from(seen.values());
}

// Pharmacy detection
function isPharmacy(result: NominatimSearchResult): boolean {
  // Direct pharmacy classification
  if (result.class === 'amenity' && result.type === 'pharmacy') {
    return true;
  }

  // Check various name fields
  const namesToCheck = [
    result.display_name,
    result.address?.name,
    result.address?.shop,
    result.address?.amenity,
    result.extratags?.brand,
    result.extratags?.operator
  ].filter(Boolean).map(n => n!.toLowerCase());

  // Check if any name contains pharmacy keywords
  return namesToCheck.some(name =>
    Array.from(PHARMACY_KEYWORDS).some(keyword =>
      name.includes(keyword)
    )
  );
}

// GET endpoint for pharmacy search
export async function GET(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://bupe.opioidpolicy.org',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Content-Type': 'application/json',
  };

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Input validation
    if (!query || !lat || !lon) {
      return new NextResponse(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: corsHeaders
      });
    }

    const sanitizedQuery = sanitizeInput(query);
    if (sanitizedQuery.length < 2) {
      return new NextResponse(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: corsHeaders
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (!validateCoordinates(latitude, longitude)) {
      return new NextResponse(JSON.stringify({ suggestions: [] }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Rate limiting
    if (!globalRateLimiter.consume()) {
      return new NextResponse(JSON.stringify({
        error: 'Too many requests. Please wait a moment.'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': '1'
        }
      });
    }

    // Check cache
    const cacheKey = generateCacheKey(sanitizedQuery, lat, lon);
    const cachedResults = searchCache.get<SearchSuggestion[]>(cacheKey);
    if (cachedResults) {
      return new NextResponse(JSON.stringify({ suggestions: cachedResults }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Determine search strategy
    const isAddress = /\d/.test(sanitizedQuery) && (sanitizedQuery.includes(' ') || sanitizedQuery.length > 10);
    const searches = isAddress
      ? [sanitizedQuery]
      : [`${sanitizedQuery} pharmacy`, sanitizedQuery];

    // Combined API call with OR syntax
    const combinedQuery = searches.join(' OR ');
    const bbox = {
      left: longitude - BOUNDING_BOX_DELTA,
      top: latitude + BOUNDING_BOX_DELTA,
      right: longitude + BOUNDING_BOX_DELTA,
      bottom: latitude - BOUNDING_BOX_DELTA
    };

    const endpoint = `https://nominatim.openstreetmap.org/search?

format=json&
q=${encodeURIComponent(combinedQuery)}&
addressdetails=1&
extratags=1&
limit=20&
bounded=1&
viewbox=${bbox.left},${bbox.top},${bbox.right},${bbox.bottom}&
countrycodes=us`;

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Nominatim search failed with status ${response.status}`);
    }

    const allResults: NominatimSearchResult[] = await response.json();

    // Filter for pharmacies and deduplicate
    const pharmacyResults = allResults.filter(isPharmacy);
    const deduplicated = deduplicatePharmacies(pharmacyResults);

    // Sort by importance and distance
    deduplicated.sort((a, b) => {
      const distA = Math.abs(parseFloat(a.lat) - latitude) + Math.abs(parseFloat(a.lon) - longitude);
      const distB = Math.abs(parseFloat(b.lat) - latitude) + Math.abs(parseFloat(b.lon) - longitude);

      const hasNameA = Boolean(a.address?.name);
      const hasNameB = Boolean(b.address?.name);

      if (hasNameA !== hasNameB) return hasNameB ? -1 : 1;
      return distA - distB;
    });

    // Format results
    const pharmacySuggestions: SearchSuggestion[] = deduplicated
      .slice(0, 15)
      .map(result => {
        let name = result.address?.name ||
                   result.address?.shop ||
                   result.address?.amenity ||
                   result.extratags?.brand ||
                   result.display_name.split(',')[0];

        name = name.replace(/\s+/g, ' ').trim();
        if (name.length > 50) {
          name = name.substring(0, 50) + '...';
        }

        const formatAddress = () => {
          const houseNumber = result.address?.house_number || '';
          const road = result.address?.road || '';
          const city = result.address?.city || result.address?.town || result.address?.village || '';
          const state = result.address?.state || '';
          const postcode = result.address?.postcode || '';

          const streetAddress = `${houseNumber} ${road}`.trim();
          const cityStateZip = [city, state, postcode].filter(Boolean).join(', ');

          if (streetAddress && cityStateZip) {
            return `${streetAddress}, ${cityStateZip}`;
          } else if (cityStateZip) {
            return cityStateZip;
          } else {
            const parts = result.display_name.split(',');
            if (parts.length > 1) {
              return parts.slice(1, -1).map(p => p.trim()).join(', ');
            }
            return result.display_name;
          }
        };

        return {
          name: name || 'Pharmacy',
          osm_id: `osm_${result.osm_type}_${result.osm_id}`,
          full_address: formatAddress()
        };
      });

    // Add manual entry option if few results
    if (pharmacySuggestions.length < 3) {
      pharmacySuggestions.push({
        name: '+ Add a pharmacy not listed',
        osm_id: 'manual_entry',
        full_address: 'Enter pharmacy details manually'
      });
    }

    // Cache the results
    searchCache.set(cacheKey, pharmacySuggestions);

    return new NextResponse(JSON.stringify({ suggestions: pharmacySuggestions }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    // Privacy-preserving error logging
    console.error('Pharmacy search error:', error instanceof Error ? error.message : 'Unknown error');

    return new NextResponse(JSON.stringify({
      suggestions: [],
      error: 'Search temporarily unavailable'
    }), {
      status: 503,
      headers: corsHeaders
    });
  }
}

// POST endpoint for pharmacy details
export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://bupe.opioidpolicy.org',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const { pharmacy_id } = body;

    // Input validation
    if (!pharmacy_id || typeof pharmacy_id !== 'string') {
      return new NextResponse(JSON.stringify({
        error: 'Invalid pharmacy ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Rate limiting
    if (!globalRateLimiter.consume()) {
      return new NextResponse(JSON.stringify({
        error: 'Too many requests. Please wait a moment.'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': '1'
        }
      });
    }

    // Handle manual entry
    if (pharmacy_id === 'manual_entry') {
      return new NextResponse(JSON.stringify({
        features: [{
          properties: {
            address: '',
            context: {
              place: { name: '' },
              postcode: { name: '' },
              region: { region_code: '' }
            },
            phone: '',
            manual: true
          },
          geometry: {
            coordinates: [0, 0]
          }
        }]
      }), {
        headers: corsHeaders
      });
    }

    // Validate OSM ID format
    if (!pharmacy_id.startsWith('osm_')) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid pharmacy ID format'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check cache
    const cachedDetails = detailsCache.get(pharmacy_id);
    if (cachedDetails) {
      return new NextResponse(JSON.stringify(cachedDetails), {
        headers: corsHeaders
      });
    }

    const parts = pharmacy_id.split('_');
    if (parts.length !== 3) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid pharmacy ID format'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const [, osmType, osmId] = parts;

    if (!['node', 'way', 'relation'].includes(osmType)) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid OSM type'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!/^\d+$/.test(osmId)) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid OSM ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get detailed info from Nominatim
    const endpoint = `https://nominatim.openstreetmap.org/lookup?
format=json&
osm_ids=${osmType.charAt(0).toUpperCase()}${osmId}&
addressdetails=1&
extratags=1`;

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Nominatim lookup error: ${response.status}`);
    }

    const details = await response.json();

    if (!details || details.length === 0) {
      return new NextResponse(JSON.stringify({
        error: 'Pharmacy details not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const result = details[0];

    const formatDetailedAddress = () => {
      const houseNumber = result.address?.house_number || '';
      const road = result.address?.road || '';
      return `${houseNumber} ${road}`.trim();
    };

    const pharmacyDetails = {
      features: [{
        properties: {
          address: formatDetailedAddress(),
          context: {
            place: {
              name: result.address?.city ||
                    result.address?.town ||
                    result.address?.village ||
                    ''
            },
            postcode: { name: result.address?.postcode || '' },
            region: { region_code: result.address?.state ? `US-${result.address.state}` : '' }
          },
          phone: result.extratags?.phone ||
                 result.extratags?.['contact:phone'] ||
                 ''
        },
        geometry: {
          coordinates: [parseFloat(result.lon), parseFloat(result.lat)]
        }
      }]
    };

    // Cache the details
    detailsCache.set(pharmacy_id, pharmacyDetails);

    return new NextResponse(JSON.stringify(pharmacyDetails), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Pharmacy details error:', error instanceof Error ? error.message : 'Unknown error');

    return new NextResponse(JSON.stringify({
      error: 'Failed to get pharmacy details'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
