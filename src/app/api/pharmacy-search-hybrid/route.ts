// src/app/api/pharmacy-search-hybrid/route.ts
import { NextResponse } from 'next/server';
import { airtableAPI } from '@/lib/airtable-api';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';

// ============= TYPES =============
interface AirtablePharmacy {
  id: string;
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone_number?: string;
  manual_entry: boolean;
  live_manual_entry: boolean;
  last_report?: string;
}

interface OsmSuggestion {
  name: string;
  osm_id?: string;
  full_address: string;
}

interface SearchSuggestion {
  name: string;
  osm_id: string;
  full_address: string;
  source?: 'osm' | 'manual' | 'reported' | 'action';
  phone_number?: string;
  distance?: number;
  in_zip?: boolean;
}

// ============= CONSTANTS =============
const CACHE_PRECISION = 2;
const BOUNDING_BOX_LAT_DELTA = 0.36; // ~25 miles
const BOUNDING_BOX_LON_DELTA = 0.36; // ~25 miles
const CACHE_TTL = 30; // REDUCED FOR DEBUGGING - 30 seconds instead of 30 minutes
const OSM_CACHE_TTL = 30; // REDUCED FOR DEBUGGING - 30 seconds instead of 15 minutes
const MAX_CACHE_ENTRIES = 1000;
const MAX_RESULTS = 20; // Return up to 20 results

// ============= CACHING =============
const airtableCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 600,
  useClones: false,
  maxKeys: MAX_CACHE_ENTRIES
});

const osmCache = new NodeCache({
  stdTTL: OSM_CACHE_TTL,
  checkperiod: 300,
  useClones: false,
  maxKeys: MAX_CACHE_ENTRIES
});

// ============= UTILITY FUNCTIONS =============
function generateCacheKey(...parts: (string | number)[]): string {
  return createHash('sha256')
    .update(parts.join('_'))
    .digest('hex')
    .substring(0, 16);
}

function sanitizeInput(query: string): string {
  return query.replace(/[^\w\s\-(),.]/g, '').substring(0, 100);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Circuit breaker
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 3;
  private readonly timeout = 60000;

  async execute<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === 'open' && Date.now() - this.lastFailTime > this.timeout) {
      this.state = 'half-open';
      this.failures = 0;
    }

    if (this.state === 'open') {
      console.log('Circuit breaker OPEN - using fallback');
      return fallback();
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`Circuit breaker opened after ${this.failures} failures`);
      }

      console.error('Circuit breaker caught error:', error);
      return fallback();
    }
  }
}

const airtableCircuit = new CircuitBreaker();

// ============= AIRTABLE FETCHING =============
async function getAirtablePharmacies(lat: number, lon: number, searchZip?: string): Promise<AirtablePharmacy[]> {
  console.log(`[DEBUG] getAirtablePharmacies called with lat=${lat}, lon=${lon}, zip=${searchZip}`);
  
  const cacheKey = generateCacheKey(
    lat.toFixed(CACHE_PRECISION), 
    lon.toFixed(CACHE_PRECISION),
    searchZip || 'no-zip'
  );

  const cached = airtableCache.get<AirtablePharmacy[]>(cacheKey);
  if (cached) {
    console.log(`[DEBUG] Airtable cache hit, returning ${cached.length} pharmacies`);
    return cached;
  }

  return airtableCircuit.execute(
    async () => {
      const latMin = lat - BOUNDING_BOX_LAT_DELTA;
      const latMax = lat + BOUNDING_BOX_LAT_DELTA;
      const lonMin = lon - BOUNDING_BOX_LON_DELTA;
      const lonMax = lon + BOUNDING_BOX_LON_DELTA;

      console.log(`[DEBUG] Airtable bounding box: lat ${latMin} to ${latMax}, lon ${lonMin} to ${lonMax}`);

      const filterFormula = `AND(
        NOT({latitude} = ''),
        NOT({longitude} = ''),
        {latitude} >= ${latMin},
        {latitude} <= ${latMax},
        {longitude} >= ${lonMin},
        {longitude} <= ${lonMax},
        OR(
          AND({manual_entry} = TRUE(), {live_manual_entry} = TRUE()),
          {manual_entry} != TRUE()
        )
      )`;

      console.log(`[DEBUG] Airtable filter formula: ${filterFormula}`);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Airtable timeout')), 5000)
      );

      const recordsPromise = airtableAPI.select({
        fields: [
          'pharmacy_id', 'pharmacy_name', 'street_address',
          'city', 'state', 'zip_code', 'latitude', 'longitude',
          'phone_number', 'manual_entry', 'live_manual_entry', 'submission_time'
        ],
        filterByFormula: filterFormula,
        maxRecords: 500,
        sort: [{field: 'submission_time', direction: 'desc'}]
      });

      const records = await Promise.race([recordsPromise, timeoutPromise]);
      console.log(`[DEBUG] Airtable returned ${records.length} raw records`);
      
      const pharmacyMap = new Map<string, AirtablePharmacy>();

      records.forEach((record) => {
        const pharmacyId = record.fields.pharmacy_id as string | undefined;
        if (!pharmacyId) return;

        const lat = record.fields.latitude as number | undefined;
        const lon = record.fields.longitude as number | undefined;
        if (!lat || !lon) return;

        const submissionTime = record.fields.submission_time as string | undefined;
        const manualEntry = record.fields.manual_entry ? true : false;
        const liveManualEntry = record.fields.live_manual_entry ? true : false;

        if (!pharmacyMap.has(pharmacyId) ||
            (submissionTime && submissionTime > (pharmacyMap.get(pharmacyId)?.last_report || ''))) {

          pharmacyMap.set(pharmacyId, {
            id: pharmacyId,
            name: (record.fields.pharmacy_name as string | undefined) || '',
            street_address: (record.fields.street_address as string | undefined) || '',
            city: (record.fields.city as string | undefined) || '',
            state: (record.fields.state as string | undefined) || '',
            zip_code: (record.fields.zip_code as string | undefined) || '',
            latitude: lat,
            longitude: lon,
            phone_number: (record.fields.phone_number as string | undefined) || undefined,
            manual_entry: manualEntry,
            live_manual_entry: liveManualEntry,
            last_report: submissionTime
          });
        }
      });

      const nearbyPharmacies = Array.from(pharmacyMap.values());
      console.log(`[DEBUG] After deduplication: ${nearbyPharmacies.length} unique pharmacies`);
      
      airtableCache.set(cacheKey, nearbyPharmacies);
      return nearbyPharmacies;
    },
    () => {
      console.log('[DEBUG] Airtable unavailable - returning empty array');
      return [];
    }
  );
}

// ============= DEDUPLICATION =============
function similarPharmacy(a: SearchSuggestion, b: SearchSuggestion): boolean {
  const normalizeAddress = (addr: string) => {
    return addr.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const aAddr = normalizeAddress(a.full_address);
  const bAddr = normalizeAddress(b.full_address);

  const aNum = aAddr.match(/^\d+/)?.[0];
  const bNum = bAddr.match(/^\d+/)?.[0];

  if (aNum && bNum && aNum === bNum) {
    const aStreet = aAddr.replace(/^\d+\s*/, '').split(' ').slice(0, 3).join(' ');
    const bStreet = bAddr.replace(/^\d+\s*/, '').split(' ').slice(0, 3).join(' ');
    
    if (aStreet === bStreet) {
      return true;
    }
  }

  if (aAddr === bAddr) {
    return true;
  }

  return false;
}

// ============= MAIN ENDPOINT =============
export async function GET(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://findbupe.org',
    'Access-Control-Allow-Methods': 'GET, POST'
  };

  const startTime = Date.now();
  console.log('\n[DEBUG] ========== NEW SEARCH REQUEST ==========');

  try {
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get('query');
    const zip = searchParams.get('zip');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');
  
    console.log(`[DEBUG] Search params: query="${query}", lat=${lat}, lon=${lon}, zip=${zip}`);

    if (!query || !lat || !lon || query.length < 2) {
      console.log('[DEBUG] Invalid params, returning empty suggestions');
      return NextResponse.json({
        suggestions: [],
        debug: { reason: 'Invalid parameters' },
        performance: { duration: Date.now() - startTime }
      }, { headers: corsHeaders });
    }

    const sanitizedQuery = sanitizeInput(query);
    const latitude = lat;
    const longitude = lon;

    if (isNaN(latitude) || isNaN(longitude) || 
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
  return NextResponse.json({
    suggestions: [],
    debug: { reason: 'Invalid coordinates' }
  }, { headers: corsHeaders });
}

    console.log(`[DEBUG] Sanitized query: "${sanitizedQuery}"`);

    // Skip cache for debugging
    console.log('[DEBUG] Skipping cache for debugging purposes');

    // Parallel fetch
    const [osmResult, airtableResult] = await Promise.allSettled([
      // OSM search
      Promise.race([
        fetch(`${request.url.split('/api/')[0]}/api/pharmacy-search?q=${encodeURIComponent(sanitizedQuery)}&lat=${lat}&lon=${lon}`),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('OSM timeout')), 3000)
        )
      ]).then(res => res.json()).catch((err) => {
        console.log('[DEBUG] OSM error:', err);
        return { suggestions: [] };
      }),

      // Airtable search
      getAirtablePharmacies(latitude, longitude, zip || undefined)
    ]);

    // Process OSM results
    let suggestions: SearchSuggestion[] = [];
    if (osmResult.status === 'fulfilled' && osmResult.value.suggestions) {
      const osmSuggestions = osmResult.value.suggestions as OsmSuggestion[];
      suggestions = osmSuggestions
        .filter((s: OsmSuggestion) => {
          const id = s.osm_id || '';
          return id !== 'manual_entry';
        })
        .map((s: OsmSuggestion) => ({
          name: s.name,
          osm_id: s.osm_id || '',
          full_address: s.full_address,
          source: 'osm' as const,
          distance: 0
        }));
      console.log(`[DEBUG] OSM returned ${suggestions.length} results`);
    } else {
      console.log('[DEBUG] OSM failed or returned no results');
    }

    // Process Airtable results
    let airtableSuggestions: SearchSuggestion[] = [];
    if (airtableResult.status === 'fulfilled' && airtableResult.value) {
      const queryLower = sanitizedQuery.toLowerCase();
      console.log(`[DEBUG] Filtering ${airtableResult.value.length} Airtable pharmacies for query "${queryLower}"`);
      
      airtableSuggestions = airtableResult.value
        .filter((pharmacy: AirtablePharmacy) => {
          const nameLower = pharmacy.name.toLowerCase();
          
          // Debug each pharmacy
          if (nameLower.includes('walgreens') || nameLower.includes('cvs')) {
            console.log(`[DEBUG] Checking pharmacy: ${pharmacy.name} in ${pharmacy.zip_code}`);
          }
          
          // Very broad matching for debugging
          const matches = nameLower.includes(queryLower) || 
                         queryLower.split(' ').some(term => nameLower.includes(term));
          
          if (matches) {
            console.log(`[DEBUG] MATCH: ${pharmacy.name} (${pharmacy.zip_code})`);
          }
          
          return matches;
        })
        .map((pharmacy: AirtablePharmacy) => ({
          name: pharmacy.name,
          osm_id: pharmacy.id,
          full_address: `${pharmacy.street_address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip_code}`.replace(/^,\s*/, ''),
          source: (pharmacy.manual_entry && pharmacy.live_manual_entry ? 'manual' : 'reported'),
          phone_number: pharmacy.phone_number,
          distance: calculateDistance(latitude, longitude, pharmacy.latitude, pharmacy.longitude),
          in_zip: zip ? pharmacy.zip_code === zip : false
        }));
      
      console.log(`[DEBUG] Airtable filtered to ${airtableSuggestions.length} results`);
    } else {
      console.log('[DEBUG] Airtable failed or returned no results');
    }

    // Merge results
    const mergedSuggestions: SearchSuggestion[] = [...suggestions];
    console.log(`[DEBUG] Starting with ${mergedSuggestions.length} OSM results`);

    let duplicatesFound = 0;
    airtableSuggestions.forEach(airtableItem => {
      if (!mergedSuggestions.some(existing => similarPharmacy(existing, airtableItem))) {
        mergedSuggestions.push(airtableItem);
      } else {
        duplicatesFound++;
      }
    });
    console.log(`[DEBUG] Added ${airtableSuggestions.length - duplicatesFound} Airtable results (${duplicatesFound} duplicates skipped)`);
    console.log(`[DEBUG] Total merged: ${mergedSuggestions.length} results`);

    // Sort
    const queryLower = sanitizedQuery.toLowerCase();
    mergedSuggestions.sort((a, b) => {
      const aExact = a.name.toLowerCase() === queryLower;
      const bExact = b.name.toLowerCase() === queryLower;
      if (aExact !== bExact) return aExact ? -1 : 1;

      const aStarts = a.name.toLowerCase().startsWith(queryLower);
      const bStarts = b.name.toLowerCase().startsWith(queryLower);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;

      if (a.in_zip !== b.in_zip) return a.in_zip ? -1 : 1;

      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }

      const priority: Record<string, number> = {
        'osm': 0, 'reported': 1, 'manual': 2
      };
      return (priority[a.source || 'osm'] || 3) - (priority[b.source || 'osm'] || 3);
    });

    // CRITICAL: Take MAX_RESULTS, not 1!
    console.log(`[DEBUG] Taking top ${MAX_RESULTS} results from ${mergedSuggestions.length} total`);
    const topResults = mergedSuggestions.slice(0, MAX_RESULTS);
    console.log(`[DEBUG] Final results count: ${topResults.length}`);

    // Add manual entry option
    topResults.push({
      name: '+ Add a pharmacy not listed',
      osm_id: 'manual_entry',
      full_address: 'Can\'t find your pharmacy? Add it to help others',
      source: 'action'
    });

    const result = {
      suggestions: topResults,
      sources: {
        osm: suggestions.length,
        airtable: airtableSuggestions.length,
        total: topResults.length - 1
      },
      debug: {
        query: sanitizedQuery,
        totalMerged: mergedSuggestions.length,
        maxResults: MAX_RESULTS,
        cacheStatus: 'disabled for debugging'
      },
      cached: false,
      performance: {
        duration: Date.now() - startTime,
        osmStatus: osmResult.status,
        airtableStatus: airtableResult.status
      }
    };

    console.log(`[DEBUG] Returning ${result.suggestions.length} suggestions`);
    console.log('[DEBUG] ========== END REQUEST ==========\n');
    
    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[DEBUG] Critical error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json({
      suggestions: [{
        name: '+ Add a pharmacy not listed',
        osm_id: 'manual_entry',
        full_address: 'Search temporarily unavailable - you can still add manually',
        source: 'action'
      }],
      error: 'Service temporarily unavailable',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' },
      performance: { duration: Date.now() - startTime }
    }, { headers: corsHeaders });
 }
}

// ============= HEALTH CHECK =============
export async function POST(request: Request) {
  if (request.headers.get('x-health-check') === 'true') {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      caches: {
        airtable: {
          size: airtableCache.keys().length,
          maxKeys: MAX_CACHE_ENTRIES
        },
        osm: {
          size: osmCache.keys().length,
          maxKeys: MAX_CACHE_ENTRIES
        }
      }
    };
    return NextResponse.json(health);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}