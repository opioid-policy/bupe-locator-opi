// src/app/api/pharmacy-search/route.ts
import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import NodeCache from 'node-cache';

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
  mapbox_id: string; // Keep for compatibility
  full_address: string;
}

// Enhanced pharmacy chains list including grocery stores with pharmacies
const PHARMACY_KEYWORDS = new Set([
  // Traditional pharmacies
  'pharmacy', 'drug store', 'apothecary', 'chemist',
  
  // Major pharmacy chains
  'cvs', 'walgreens', 'rite aid', 'duane reade', 
  'medicine shoppe', 'healthmart', 'genoa', 'capsule',
  
  // Grocery stores with pharmacies
  'walmart', 'target', 'kroger', 'safeway', 'albertsons',
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

// Generate a random session-based key for rate limiting
// This avoids using IP addresses entirely
function generateRateLimitKey(): string {
  // Use a timestamp-based approach with random component
  // This provides rate limiting without tracking users
  const timestamp = Math.floor(Date.now() / 1000); // Current second
  const random = Math.random().toString(36).substring(7);
  return `${timestamp}-${random}`;
}

// Rate limiting without IP tracking
// Using a global rate limiter to prevent API abuse
const globalRateLimiter = new RateLimiterMemory({
  points: 10, // Allow 10 requests per second globally
  duration: 1,
  blockDuration: 2, // Block for 2 seconds if exceeded
});

// Per-session rate limiter (using timestamp buckets)
const sessionRateLimiter = new RateLimiterMemory({
  points: 3, // Allow 3 requests per 2 seconds per session
  duration: 2,
  blockDuration: 3, // Block for 3 seconds if exceeded
});

// Extended cache for better performance (2 hours for search, 24 hours for details)
// Note: In production, consider using Vercel KV or similar for persistent caching
const searchCache = new NodeCache({ stdTTL: 7200 });
const detailsCache = new NodeCache({ stdTTL: 86400 });

// Deduplicate pharmacies based on proximity and name similarity
function deduplicatePharmacies(results: NominatimSearchResult[]): NominatimSearchResult[] {
  const deduplicated: NominatimSearchResult[] = [];
  const seen = new Map<string, NominatimSearchResult>();
  
  for (const result of results) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Create a key based on rounded coordinates (approximately 100m precision)
    const geoKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    
    // Extract core name for comparison
    const name = (result.address?.name || 
                 result.address?.shop || 
                 result.address?.amenity || 
                 result.display_name.split(',')[0]).toLowerCase();
    
    // Check for duplicates
    let isDuplicate = false;
    for (const [key, existing] of seen.entries()) {
      const [existingGeo, existingName] = key.split('|');
      
      // Check if same location or very similar name at nearby location
      if (existingGeo === geoKey || 
          (similarName(name, existingName) && nearbyLocation(lat, lon, existing))) {
        // Keep the one with more complete data
        if (hasMoreCompleteData(result, existing)) {
          seen.set(`${geoKey}|${name}`, result);
          const index = deduplicated.findIndex(d => d === existing);
          if (index !== -1) deduplicated[index] = result;
        }
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.set(`${geoKey}|${name}`, result);
      deduplicated.push(result);
    }
  }
  
  return deduplicated;
}

// Check if two pharmacy names are similar
function similarName(name1: string, name2: string): boolean {
  // Remove common suffixes
  const clean = (n: string) => n.replace(/pharmacy|drug|store|mart|market|#\d+/gi, '').trim();
  const cleaned1 = clean(name1);
  const cleaned2 = clean(name2);
  
  // Check for exact match or one contains the other
  return cleaned1 === cleaned2 || 
         cleaned1.includes(cleaned2) || 
         cleaned2.includes(cleaned1);
}

// Check if two locations are nearby (within ~500m)
function nearbyLocation(lat1: number, lon1: number, result2: NominatimSearchResult): boolean {
  const lat2 = parseFloat(result2.lat);
  const lon2 = parseFloat(result2.lon);
  
  // Rough distance calculation (good enough for deduplication)
  const latDiff = Math.abs(lat1 - lat2);
  const lonDiff = Math.abs(lon1 - lon2);
  
  // Approximately 0.005 degrees = 500m
  return latDiff < 0.005 && lonDiff < 0.005;
}

// Determine which result has more complete data
function hasMoreCompleteData(result1: NominatimSearchResult, result2: NominatimSearchResult): boolean {
  let score1 = 0, score2 = 0;
  
  // Score based on completeness of address data
  if (result1.address?.name) score1 += 2;
  if (result2.address?.name) score2 += 2;
  if (result1.address?.house_number) score1++;
  if (result2.address?.house_number) score2++;
  if (result1.address?.road) score1++;
  if (result2.address?.road) score2++;
  if (result1.extratags?.phone) score1 += 2;
  if (result2.extratags?.phone) score2 += 2;
  
  return score1 > score2;
}

// Enhanced pharmacy detection
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
  for (const name of namesToCheck) {
    for (const keyword of PHARMACY_KEYWORDS) {
      if (name.includes(keyword)) {
        return true;
      }
    }
  }
  
  // Check for healthcare/pharmacy classification in OSM
  if (result.class === 'healthcare' || 
      result.class === 'shop' && namesToCheck.some(n => n.includes('pharmacy'))) {
    return true;
  }
  
  return false;
}

// GET endpoint for pharmacy search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Input validation
    if (!query || !lat || !lon) {
      return NextResponse.json({ suggestions: [] });
    }

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Apply rate limiting without IP tracking
    try {
      // Global rate limit to protect the API
      await globalRateLimiter.consume('global');
      
      // Optional: Use session token from frontend for per-user limiting
      const sessionToken = searchParams.get('session') || generateRateLimitKey();
      await sessionRateLimiter.consume(sessionToken);
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '3',
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    // Check cache
    const cacheKey = `search_${query}_${lat}_${lon}`;
    const cachedResults = searchCache.get<SearchSuggestion[]>(cacheKey);
    if (cachedResults) {
      return new NextResponse(JSON.stringify({ suggestions: cachedResults }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
          'X-Cache': 'HIT',
        },
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Larger bounding box for better coverage (roughly 30 miles)
    const bbox = {
      left: longitude - 0.4,
      top: latitude + 0.4,
      right: longitude + 0.4,
      bottom: latitude - 0.4
    };

    // Determine search strategy based on query type
    const isAddress = /\d/.test(query) && (query.includes(' ') || query.length > 10);
    const searches = isAddress 
      ? [query] // If it looks like an address, search as-is
      : [`${query} pharmacy`, query]; // Otherwise search both with and without "pharmacy"
    
    const allResults: NominatimSearchResult[] = [];
    
    for (const searchQuery of searches) {
      const endpoint = `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `addressdetails=1&` +
        `extratags=1&` + // Get extra tags for phone numbers
        `limit=20&` + // Increase limit for better coverage
        `bounded=1&` +
        `viewbox=${bbox.left},${bbox.top},${bbox.right},${bbox.bottom}&` +
        `countrycodes=us`;

      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const results: NominatimSearchResult[] = await response.json();
        allResults.push(...results);
      }
    }

    // Filter for pharmacies and deduplicate
    const pharmacyResults = allResults.filter(isPharmacy);
    const deduplicated = deduplicatePharmacies(pharmacyResults);
    
    // Sort by importance and distance
    deduplicated.sort((a, b) => {
      const distA = Math.abs(parseFloat(a.lat) - latitude) + Math.abs(parseFloat(a.lon) - longitude);
      const distB = Math.abs(parseFloat(b.lat) - latitude) + Math.abs(parseFloat(b.lon) - longitude);
      
      // Prioritize results with names
      const hasNameA = a.address?.name ? 1 : 0;
      const hasNameB = b.address?.name ? 1 : 0;
      
      if (hasNameA !== hasNameB) return hasNameB - hasNameA;
      
      // Then sort by distance
      return distA - distB;
    });

    // Format results
    const pharmacySuggestions: SearchSuggestion[] = deduplicated
      .slice(0, 15) // Return up to 15 results
      .map(result => {
        // Extract pharmacy name with better logic
        let name = result.address?.name || 
                   result.address?.shop ||
                   result.address?.amenity ||
                   result.extratags?.brand ||
                   '';
        
        // If no specific name, try to extract from display name
        if (!name) {
          const parts = result.display_name.split(',');
          name = parts[0];
          
          // Try to identify pharmacy name from common patterns
          for (const part of parts) {
            const lower = part.toLowerCase().trim();
            for (const keyword of PHARMACY_KEYWORDS) {
              if (lower.includes(keyword)) {
                name = part.trim();
                break;
              }
            }
          }
        }

        // Clean up the name
        name = name.replace(/\s+/g, ' ').trim();
        if (name.length > 50) {
          name = name.substring(0, 50) + '...';
        }

        // Format address in standard US format
        const formatAddress = () => {
          const houseNumber = result.address?.house_number || '';
          const road = result.address?.road || '';
          const city = result.address?.city || result.address?.town || result.address?.village || '';
          const state = result.address?.state || '';
          const postcode = result.address?.postcode || '';
          
          // Build address components
          const streetAddress = `${houseNumber} ${road}`.trim();
          const cityStateZip = [city, state, postcode].filter(Boolean).join(', ');
          
          // Combine components
          if (streetAddress && cityStateZip) {
            return `${streetAddress}, ${cityStateZip}`;
          } else if (cityStateZip) {
            return cityStateZip;
          } else {
            // Fallback to display name but clean it up
            const parts = result.display_name.split(',');
            if (parts.length > 1) {
              // Remove the pharmacy name and country
              const cleanParts = parts.slice(1, -1).map(p => p.trim());
              return cleanParts.join(', ');
            }
            return result.display_name;
          }
        };

        return {
          name: name || 'Pharmacy',
          mapbox_id: `osm_${result.osm_type}_${result.osm_id}`,
          full_address: formatAddress()
        };
      });

    // Add a manual entry option if less than 3 results found
    if (pharmacySuggestions.length < 3) {
      pharmacySuggestions.push({
        name: '+ Add a pharmacy not listed',
        mapbox_id: 'manual_entry',
        full_address: 'Enter pharmacy details manually'
      });
    }

    // Cache the results
    searchCache.set(cacheKey, pharmacySuggestions);

    return new NextResponse(JSON.stringify({ suggestions: pharmacySuggestions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
        'X-Cache': 'MISS',
      },
    });
    
  } catch (error) {
    // Privacy: Don't leak error details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Pharmacy search error:', error);
    }
    
    return NextResponse.json(
      { suggestions: [], error: 'Search temporarily unavailable' },
      { status: 503 }
    );
  }
}

// POST endpoint for pharmacy details
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pharmacy_id } = body;

    // Input validation
    if (!pharmacy_id || typeof pharmacy_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid pharmacy ID' }, 
        { status: 400 }
      );
    }

    // Handle manual entry requests
    if (pharmacy_id === 'manual_entry') {
      return NextResponse.json({
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
      });
    }

    // Validate OSM ID format
    if (!pharmacy_id.startsWith('osm_')) {
      return NextResponse.json(
        { error: 'Invalid pharmacy ID format' }, 
        { status: 400 }
      );
    }

    // Apply rate limiting without IP tracking
    try {
      // Global rate limit to protect the API
      await globalRateLimiter.consume('global');
      
      // Use pharmacy_id as a simple rate limit key
      const rateLimitKey = `details-${pharmacy_id.substring(0, 10)}`;
      await sessionRateLimiter.consume(rateLimitKey);
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '3'
          }
        }
      );
    }

    // Check cache
    const cachedDetails = detailsCache.get(pharmacy_id);
    if (cachedDetails) {
      return NextResponse.json(cachedDetails);
    }

    // Extract and validate OSM details
    const parts = pharmacy_id.split('_');
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid pharmacy ID format' }, 
        { status: 400 }
      );
    }
    
    const [, osmType, osmId] = parts;
    
    // Validate OSM type
    if (!['node', 'way', 'relation'].includes(osmType)) {
      return NextResponse.json(
        { error: 'Invalid OSM type' }, 
        { status: 400 }
      );
    }
    
    // Validate OSM ID is numeric
    if (!/^\d+$/.test(osmId)) {
      return NextResponse.json(
        { error: 'Invalid OSM ID' }, 
        { status: 400 }
      );
    }
    
    // Get detailed info from Nominatim
    const endpoint = `https://nominatim.openstreetmap.org/lookup?` +
      `format=json&` +
      `osm_ids=${osmType.charAt(0).toUpperCase()}${osmId}&` +
      `addressdetails=1&` +
      `extratags=1`;

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Nominatim lookup error: ${response.status}`);
    }

    const details = await response.json();
    
    if (!details || details.length === 0) {
      return NextResponse.json(
        { error: 'Pharmacy details not found' },
        { status: 404 }
      );
    }

    const result = details[0];
    
    // Format address in standard US format
    const formatDetailedAddress = () => {
      const houseNumber = result.address?.house_number || '';
      const road = result.address?.road || '';
      
      // Build full formatted address
      const streetAddress = `${houseNumber} ${road}`.trim();
      return streetAddress;
    };
    
    // Format response to match existing structure
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

    return NextResponse.json(pharmacyDetails);

  } catch (error) {
    // Privacy: Don't leak error details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Pharmacy details error:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to get pharmacy details' }, 
      { status: 500 }
    );
  }
}