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

interface SearchSuggestion {
  name: string;
  osm_id: string;
  full_address: string;
  source?: 'osm' | 'manual' | 'reported' | 'action';
  phone_number?: string;
}

// ============= CONSTANTS =============
const CACHE_PRECISION = 2; // decimal places for cache keys
const BOUNDING_BOX_LAT_DELTA = 0.5; // ~15 miles
const BOUNDING_BOX_LON_DELTA = 0.5; // ~15 miles
const CACHE_TTL = 1800; // 30 minutes
const OSM_CACHE_TTL = 900; // 15 minutes
const MAX_CACHE_ENTRIES = 1000; // Prevent unbounded memory growth

// ============= PRODUCTION CACHING STRATEGY =============
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
// Generate privacy-preserving cache keys
function generateCacheKey(...parts: (string | number)[]): string {
  return createHash('sha256')
    .update(parts.join('_'))
    .digest('hex')
    .substring(0, 16);
}

// Input sanitization
function sanitizeInput(query: string): string {
  return query.replace(/[^\w\s\-(),.]/g, '').substring(0, 100);
}

// Circuit breaker for Airtable to prevent cascading failures
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 3; // Open after 3 failures
  private readonly timeout = 60000; // Try again after 1 minute

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

// ============= OPTIMIZED AIRTABLE FETCHING =============
async function getAirtablePharmacies(lat: number, lon: number): Promise<AirtablePharmacy[]> {
  // Calculate bounding box (about 20 miles radius)
  const latMin = lat - 0.3;
  const latMax = lat + 0.3;
  const lonMin = lon - 0.3;
  const lonMax = lon + 0.3;

  // Simple filter - only check location and valid coordinates
  const filterFormula = `AND(
    NOT({latitude} = ''),
    NOT({longitude} = ''),
    {latitude} >= ${latMin},
    {latitude} <= ${latMax},
    {longitude} >= ${lonMin},
    {longitude} <= ${lonMax}
  )`;

// More precise cache key
  const cacheKey = generateCacheKey(lat.toFixed(CACHE_PRECISION), lon.toFixed(CACHE_PRECISION));

  // Check cache first
  const cached = airtableCache.get<AirtablePharmacy[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Use circuit breaker for Airtable calls
  return airtableCircuit.execute(
    async () => {
      // Calculate smaller bounding box (15 miles)
      const latMin = lat - BOUNDING_BOX_LAT_DELTA;
      const latMax = lat + BOUNDING_BOX_LAT_DELTA;
      const lonMin = lon - BOUNDING_BOX_LON_DELTA;
      const lonMax = lon + BOUNDING_BOX_LON_DELTA;

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
        maxRecords: 200,
        sort: [{field: 'submission_time', direction: 'desc'}]
      });

      const records = await Promise.race([recordsPromise, timeoutPromise]);
      const pharmacyMap = new Map<string, AirtablePharmacy>();

      records.forEach((record) => {
        const pharmacyId = record.fields.pharmacy_id as string | undefined;
        if (!pharmacyId) return;

        const lat = record.fields.latitude as number | undefined;
        const lon = record.fields.longitude as number | undefined;
        if (!lat || !lon) return;

        const submissionTime = record.fields.submission_time as string | undefined;

        // Convert to boolean safely
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
      airtableCache.set(cacheKey, nearbyPharmacies);
      return nearbyPharmacies;
    },
    () => {
      console.log('Airtable unavailable - returning empty array');
      return [];
    }
  );
}

// ============= DEDUPLICATION =============
// Update the similarPharmacy function to be more strict
function similarPharmacy(a: SearchSuggestion, b: SearchSuggestion): boolean {
  // Only consider them duplicates if they have the exact same address
  // This allows multiple locations of the same chain (e.g., multiple CVS stores)
  const aNum = a.full_address.match(/^\d+/)?.[0];
  const bNum = b.full_address.match(/^\d+/)?.[0];

  // Only consider them similar if they have the same street number AND same source
  return !!aNum && !!bNum && aNum === bNum && a.source === b.source;
}


// ============= MAIN ENDPOINT =============
export async function GET(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://bupe.opioidpolicy.org',
    'Access-Control-Allow-Methods': 'GET, POST'
  };



  
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Input validation
    if (!query || !lat || !lon || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        performance: { duration: Date.now() - startTime }
      }, { headers: corsHeaders });
    }

    const sanitizedQuery = sanitizeInput(query);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Check combined cache first for ultra-fast response
    const fullCacheKey = generateCacheKey(sanitizedQuery, lat, lon);
    const cachedResult = osmCache.get(fullCacheKey);

    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        performance: { duration: Date.now() - startTime }
      }, { headers: corsHeaders });
    }

    // Parallel fetch with individual timeouts
    const [osmResult, airtableResult] = await Promise.allSettled([
      // OSM search with timeout
      Promise.race([
        fetch(`${request.url.split('/api/')[0]}/api/pharmacy-search?q=${encodeURIComponent(sanitizedQuery)}&lat=${lat}&lon=${lon}`),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('OSM timeout')), 3000)
        )
      ]).then(res => res.json()).catch(() => ({ suggestions: [] })),

      // Airtable search
      getAirtablePharmacies(latitude, longitude)
    ]);

    // Process OSM results
    let suggestions: SearchSuggestion[] = [];
    if (osmResult.status === 'fulfilled' && osmResult.value.suggestions) {
      suggestions = osmResult.value.suggestions
        .filter((s: SearchSuggestion) => s.osm_id !== 'manual_entry')
        .map((s: SearchSuggestion) => ({
          ...s,
          source: s.source || 'osm'
        }));
    }

    // Process Airtable results
    let airtableSuggestions: SearchSuggestion[] = [];
    if (airtableResult.status === 'fulfilled' && airtableResult.value) {
      const queryLower = sanitizedQuery.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 1);

      airtableSuggestions = airtableResult.value
        .filter((pharmacy: AirtablePharmacy) => {
          const searchText = `${pharmacy.name} ${pharmacy.street_address} ${pharmacy.city}`.toLowerCase();
          return queryTerms.every(term => searchText.includes(term));
        })
        .map((pharmacy: AirtablePharmacy) => ({
          name: pharmacy.name,
          osm_id: pharmacy.id,
          full_address: `${pharmacy.street_address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip_code}`.replace(/^,\s*/, ''),
          source: pharmacy.manual_entry ? 'manual' : 'reported',
          phone_number: pharmacy.phone_number
        }));
    }

    // Merge and deduplicate
    const mergedSuggestions: SearchSuggestion[] = [...suggestions];

    airtableSuggestions.forEach(airtableItem => {
      if (!mergedSuggestions.some(existing => similarPharmacy(existing, airtableItem))) {
        mergedSuggestions.push(airtableItem);
      }
    });

    // Sort by relevance
    const queryLower = sanitizedQuery.toLowerCase();
    mergedSuggestions.sort((a, b) => {
      const aExact = a.name.toLowerCase() === queryLower;
      const bExact = b.name.toLowerCase() === queryLower;
      if (aExact !== bExact) return aExact ? -1 : 1;

      const priority: Record<string, number> = {
        'osm': 0, 'manual': 1, 'reported': 2
      };
      return (priority[a.source || 'osm'] || 3) - (priority[b.source || 'osm'] || 3);
    });

    // Take top results
    const topResults = mergedSuggestions.slice(0, 1);

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
      cached: false,
      performance: {
        duration: Date.now() - startTime,
        osmStatus: osmResult.status,
        airtableStatus: airtableResult.status
      }
    };

    // Cache the successful result
    osmCache.set(fullCacheKey, result);
    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('Hybrid search critical error:', error instanceof Error ? error.message : 'Unknown error');

    // Emergency fallback
    return NextResponse.json({
      suggestions: [{
        name: '+ Add a pharmacy not listed',
        osm_id: 'manual_entry',
        full_address: 'Search temporarily unavailable - you can still add manually',
        source: 'action'
      }],
      error: 'Service temporarily unavailable',
      performance: { duration: Date.now() - startTime }
    }, { headers: corsHeaders });
  }
}

// ============= HEALTH CHECK ENDPOINT =============
export async function POST(request: Request) {
  // Simple health check for monitoring
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

  // Return 404 for other POST requests
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
