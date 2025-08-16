// src/app/api/pharmacy-search-hybrid/route.ts
import { NextResponse } from 'next/server';
import { table } from '@/lib/airtable';
import NodeCache from 'node-cache';

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
  mapbox_id: string;
  full_address: string;
  source?: 'osm' | 'manual' | 'reported' | 'action';
  phone_number?: string;
}

// ============= PRODUCTION CACHING STRATEGY =============
// Longer cache times to reduce API calls and improve performance
const airtableCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes (was 10)
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Don't clone data for better memory usage
});

const osmCache = new NodeCache({ 
  stdTTL: 900, // 15 minutes for OSM results
  checkperiod: 300,
  useClones: false
});

// Circuit breaker for Airtable to prevent cascading failures
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 3; // Open after 3 failures
  private readonly timeout = 60000; // Try again after 1 minute

  async execute<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open' && Date.now() - this.lastFailTime > this.timeout) {
      this.state = 'half-open';
      this.failures = 0;
    }

    // If circuit is open, return fallback immediately
    if (this.state === 'open') {
      console.log('Circuit breaker OPEN - using fallback');
      return fallback();
    }

    try {
      const result = await fn();
      // Success - reset failures
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
  // Broader cache key for better hit rate (0.1 degree = ~7 miles)
  const cacheKey = `airtable_${lat.toFixed(1)}_${lon.toFixed(1)}`;
  
  // Check cache first
  const cached = airtableCache.get<AirtablePharmacy[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Use circuit breaker for Airtable calls
  return airtableCircuit.execute(
    async () => {
      // Calculate bounding box for more efficient Airtable query
      const latMin = lat - 0.7; // ~50 miles
      const latMax = lat + 0.7;
      const lonMin = lon - 0.8; // Adjust for longitude compression at higher latitudes
      const lonMax = lon + 0.8;

      // More efficient filter formula
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

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Airtable timeout')), 5000)
      );

      const recordsPromise = table.select({
        fields: [
          'pharmacy_id', 'pharmacy_name', 'street_address', 
          'city', 'state', 'zip_code', 'latitude', 'longitude', 
          'phone_number', 'manual_entry', 'live_manual_entry', 'submission_time'
        ],
        filterByFormula: filterFormula,
        maxRecords: 200, // Limit to prevent memory issues
        sort: [{field: 'submission_time', direction: 'desc'}]
      }).all();

      const records = await Promise.race([recordsPromise, timeoutPromise]);

      // Process records into unique pharmacies
      const pharmacyMap = new Map<string, AirtablePharmacy>();
      
      records.forEach(record => {
        const pharmacyId = record.get('pharmacy_id') as string;
        if (!pharmacyId) return;
        
        const lat = record.get('latitude') as number;
        const lon = record.get('longitude') as number;
        if (!lat || !lon) return;
        
        const submissionTime = record.get('submission_time') as string;
        
        // Keep only the most recent record for each pharmacy
        if (!pharmacyMap.has(pharmacyId) || 
            submissionTime > (pharmacyMap.get(pharmacyId)?.last_report || '')) {
          
          pharmacyMap.set(pharmacyId, {
            id: pharmacyId,
            name: record.get('pharmacy_name') as string || '',
            street_address: record.get('street_address') as string || '',
            city: record.get('city') as string || '',
            state: record.get('state') as string || '',
            zip_code: record.get('zip_code') as string || '',
            latitude: lat,
            longitude: lon,
            phone_number: record.get('phone_number') as string || '',
            manual_entry: record.get('manual_entry') === true,
            live_manual_entry: record.get('live_manual_entry') === true,
            last_report: submissionTime
          });
        }
      });

      const nearbyPharmacies = Array.from(pharmacyMap.values());
      
      // Cache the results
      airtableCache.set(cacheKey, nearbyPharmacies);
      
      return nearbyPharmacies;
    },
    () => {
      // Fallback: return empty array if Airtable fails
      console.log('Airtable unavailable - returning empty array');
      return [];
    }
  );
}


// ============= DEDUPLICATION =============
function similarPharmacy(pharmacy1: SearchSuggestion, pharmacy2: SearchSuggestion): boolean {
  const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const name1 = clean(pharmacy1.name);
  const name2 = clean(pharmacy2.name);
  
  // Quick name check
  if (name1 === name2 || 
      (name1.length > 3 && name2.length > 3 && 
       (name1.includes(name2) || name2.includes(name1)))) {
    
    // Check street numbers
    const num1 = pharmacy1.full_address.match(/^\d+/)?.[0];
    const num2 = pharmacy2.full_address.match(/^\d+/)?.[0];
    
    if (num1 && num2 && num1 === num2) {
      return true;
    }
  }
  
  return false;
}

// ============= MAIN ENDPOINT =============
export async function GET(request: Request) {
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
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Check combined cache first for ultra-fast response
    const fullCacheKey = `hybrid_${query}_${lat}_${lon}`;
    const cachedResult = osmCache.get(fullCacheKey);
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        performance: { duration: Date.now() - startTime }
      });
    }

    // Parallel fetch with individual timeouts
    const [osmResult, airtableResult] = await Promise.allSettled([
      // OSM search with timeout
      Promise.race([
        fetch(`${request.url.split('/api/')[0]}/api/pharmacy-search?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}`),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('OSM timeout')), 3000)
        )
      ]).then(res => res.json()).catch(() => ({ suggestions: [] })),
      
      // Airtable search (already has circuit breaker)
      getAirtablePharmacies(latitude, longitude)
    ]);

    // Process OSM results
    let suggestions: SearchSuggestion[] = [];
    if (osmResult.status === 'fulfilled' && osmResult.value.suggestions) {
      suggestions = osmResult.value.suggestions
        .filter((s: SearchSuggestion) => s.mapbox_id !== 'manual_entry')
        .map((s: SearchSuggestion) => ({
          ...s,
          source: s.source || 'osm'
        }));
    }

    // Process Airtable results
    let airtableSuggestions: SearchSuggestion[] = [];
    if (airtableResult.status === 'fulfilled' && airtableResult.value) {
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 1);
      
      // Filter and format Airtable results
      airtableSuggestions = airtableResult.value
        .filter((pharmacy: AirtablePharmacy) => {
          const searchText = `${pharmacy.name} ${pharmacy.street_address} ${pharmacy.city}`.toLowerCase();
          return queryTerms.every(term => searchText.includes(term));
        })
        .map((pharmacy: AirtablePharmacy) => ({
          name: pharmacy.name,
          mapbox_id: pharmacy.id,
          full_address: `${pharmacy.street_address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip_code}`.replace(/^,\s*/, ''),
          source: pharmacy.manual_entry ? 'manual' : 'reported' as 'manual' | 'reported',
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
    const queryLower = query.toLowerCase();
    mergedSuggestions.sort((a, b) => {
      // Exact matches first
      const aExact = a.name.toLowerCase() === queryLower;
      const bExact = b.name.toLowerCase() === queryLower;
      if (aExact !== bExact) return aExact ? -1 : 1;
      
      // Then by source priority
      const priority: Record<string, number> = { 
        'osm': 0, 'manual': 1, 'reported': 2
      };
      return (priority[a.source || 'osm'] || 3) - (priority[b.source || 'osm'] || 3);
    });

    // Take top 5 results
    const topResults = mergedSuggestions.slice(0, 5);

    // Add manual entry option
    topResults.push({
      name: '+ Add a pharmacy not listed',
      mapbox_id: 'manual_entry',
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

    return NextResponse.json(result);

  } catch (error) {
    console.error('Hybrid search critical error:', error);
    
    // Emergency fallback - always provide manual entry option
    return NextResponse.json({
      suggestions: [{
        name: '+ Add a pharmacy not listed',
        mapbox_id: 'manual_entry',
        full_address: 'Search temporarily unavailable - you can still add manually',
        source: 'action'
      }],
      error: 'Service temporarily unavailable',
      performance: { duration: Date.now() - startTime }
    });
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
        airtable: airtableCache.keys().length,
        osm: osmCache.keys().length
      }
    };
    return NextResponse.json(health);
  }
  
  // Return 404 for other POST requests
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}