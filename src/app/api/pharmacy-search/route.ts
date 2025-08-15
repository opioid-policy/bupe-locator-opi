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
  };
}

interface SearchSuggestion {
  name: string;
  mapbox_id: string; // Keep this name for compatibility with your existing code
  full_address: string;
}

// Rate limiting for search requests (be respectful to Nominatim)
const searchRateLimiter = new RateLimiterMemory({
  points: 1, // 1 request per second
  duration: 1,
});

// Cache search results for 1 hour
const searchCache = new NodeCache({ stdTTL: 3600 });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!query || !lat || !lon) {
      return NextResponse.json({ suggestions: [] });
    }

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Rate limiting
    await searchRateLimiter.consume('pharmacy_search');

    // Create cache key
    const cacheKey = `${query}_${lat}_${lon}`;
    const cachedResults = searchCache.get<SearchSuggestion[]>(cacheKey);
    if (cachedResults) {
      return NextResponse.json({ 
        suggestions: cachedResults
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Create a bounding box around the user's location (roughly 20 miles)
    const bbox = {
      left: longitude - 0.3,
      top: latitude + 0.3,
      right: longitude + 0.3,
      bottom: latitude - 0.3
    };

    // Search for pharmacies using Nominatim
    const searchQuery = `${query} pharmacy`;
    const endpoint = `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(searchQuery)}&` +
      `addressdetails=1&` +
      `limit=15&` +
      `bounded=1&` +
      `viewbox=${bbox.left},${bbox.top},${bbox.right},${bbox.bottom}&` +
      `countrycodes=us`;

    console.log(`Searching pharmacies: "${query}" near ${lat},${lon}`);

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Nominatim search error: ${response.status}`);
      return NextResponse.json({ suggestions: [] });
    }

    const results: NominatimSearchResult[] = await response.json();

    // Filter and format results
    const pharmacySuggestions: SearchSuggestion[] = results
      .filter(result => {
        const name = result.display_name.toLowerCase();
        const isPharmacy = 
          (result.class === 'amenity' && result.type === 'pharmacy') ||
          name.includes('pharmacy') ||
          name.includes('cvs') ||
          name.includes('walgreens') ||
          name.includes('rite aid') ||
          name.includes('walmart') ||
          name.includes('target') ||
          name.includes('kroger') ||
          name.includes('safeway') ||
          name.includes('meijer');
        
        return isPharmacy;
      })
      .map(result => {
        // Extract pharmacy name
        let name = result.address?.name || 
                   result.address?.shop ||
                   result.display_name.split(',')[0];

        // Clean up the name
        if (name && name.length > 50) {
          name = name.split(',')[0];
        }

        return {
          name: name || 'Pharmacy',
          mapbox_id: `osm_${result.osm_type}_${result.osm_id}`, // Create compatible ID
          full_address: result.display_name
        };
      })
      .slice(0, 10); // Limit to 10 results

    // Cache the results
    searchCache.set(cacheKey, pharmacySuggestions);

    return NextResponse.json({ 
      suggestions: pharmacySuggestions
    });

  } catch (error) {
    console.error('Pharmacy search error:', error);
    
    if (error instanceof Error && error.message.includes('Cannot consume')) {
      return NextResponse.json({ suggestions: [] });
    }
    
    return NextResponse.json({ suggestions: [] });
  }
}

// Handle detailed pharmacy info requests
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pharmacy_id } = body;

    if (!pharmacy_id || !pharmacy_id.startsWith('osm_')) {
      return NextResponse.json(
        { error: 'Invalid pharmacy ID' }, 
        { status: 400 }
      );
    }

    // Extract OSM details from our custom ID format
    const [, osmType, osmId] = pharmacy_id.split('_');
    
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
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim lookup error: ${response.status}`);
    }

    const details = await response.json();
    
    if (!details || details.length === 0) {
      throw new Error('No details found');
    }

    const result = details[0];
    
    // Format response to match your existing Mapbox structure
    const pharmacyDetails = {
      features: [{
        properties: {
          address: result.address?.road || result.address?.house_number ? 
            `${result.address.house_number || ''} ${result.address.road || ''}`.trim() : '',
          context: {
            place: { name: result.address?.city || result.address?.town || result.address?.village || '' },
            postcode: { name: result.address?.postcode || '' },
            region: { region_code: `US-${result.address?.state || ''}` }
          },
          phone: result.extratags?.phone || result.extratags?.['contact:phone'] || ''
        },
        geometry: {
          coordinates: [parseFloat(result.lon), parseFloat(result.lat)]
        }
      }]
    };

    return NextResponse.json(pharmacyDetails);

  } catch (error) {
    console.error('Pharmacy details error:', error);
    return NextResponse.json(
      { error: 'Failed to get pharmacy details' }, 
      { status: 500 }
    );
  }
}