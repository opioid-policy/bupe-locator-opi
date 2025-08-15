// src/app/api/pharmacy-search/route.ts - Overpass API implementation

import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import NodeCache from 'node-cache';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: {
    name?: string;
    amenity?: string;
    shop?: string;
    operator?: string;
    brand?: string;
    'addr:housenumber'?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    phone?: string;
    'contact:phone'?: string;
    opening_hours?: string;
  };
}

interface SearchSuggestion {
  name: string;
  mapbox_id: string;
  full_address: string;
  distance?: number;
}

// Rate limiting for Overpass API (be very respectful)
const searchRateLimiter = new RateLimiterMemory({
  points: 1, // 1 request per 2 seconds for Overpass
  duration: 2,
});

const searchCache = new NodeCache({ stdTTL: 7200 }); // 2 hour cache

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

    await searchRateLimiter.consume('overpass_search');

    const cacheKey = `overpass_${query}_${lat}_${lon}`;
    const cachedResults = searchCache.get<SearchSuggestion[]>(cacheKey);
    if (cachedResults) {
      return NextResponse.json({ suggestions: cachedResults });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    console.log(`Overpass pharmacy search for: "${query}" near ${lat},${lon}`);

    // Get all pharmacies in the area using Overpass API
    const pharmacies = await searchPharmaciesWithOverpass(latitude, longitude, query);
    
    console.log(`Found ${pharmacies.length} pharmacies from Overpass`);

    // Process and filter results
    const suggestions = processOverpassResults(pharmacies, query, latitude, longitude);

    console.log(`Returning ${suggestions.length} suggestions`);

    searchCache.set(cacheKey, suggestions);
    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Overpass pharmacy search error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

async function searchPharmaciesWithOverpass(
  lat: number, 
  lon: number, 
  query: string, 
  radius: number = 30000 // 30km radius
): Promise<OverpassElement[]> {
  
  const queryLower = query.toLowerCase();
  
  // Determine search strategy
  const isAddressSearch = /\d+.*?(street|st|road|rd|avenue|ave|drive|dr|boulevard|blvd|lane|ln|way|circle|cir|court|ct)/i.test(query);
  
  let overpassQuery: string;
  
  if (isAddressSearch) {
    // For address searches, cast a wider net and filter later
    overpassQuery = `
      [out:json][timeout:15];
      (
        node["amenity"="pharmacy"](around:${radius/2},${lat},${lon});
        way["amenity"="pharmacy"](around:${radius/2},${lat},${lon});
        node["shop"="chemist"](around:${radius/2},${lat},${lon});
        node["name"~".*[Pp]harmacy.*"](around:${radius/2},${lat},${lon});
        way["name"~".*[Pp]harmacy.*"](around:${radius/2},${lat},${lon});
      );
      out center meta;
    `;
  } else {
    // For name/chain searches, use more targeted approach
    const majorChains = ['CVS', 'Walgreens', 'Rite Aid', 'Walmart', 'Target', 'Meijer', 'Kroger', 'Costco', 'Safeway', 'Publix'];
    const isChainSearch = majorChains.some(chain => queryLower.includes(chain.toLowerCase()));
    
    if (isChainSearch) {
      // Chain-specific search
      const chainRegex = queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex chars
      overpassQuery = `
        [out:json][timeout:15];
        (
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          way["amenity"="pharmacy"](around:${radius},${lat},${lon});
          node["name"~".*${chainRegex}.*",i](around:${radius},${lat},${lon});
          way["name"~".*${chainRegex}.*",i](around:${radius},${lat},${lon});
          node["operator"~".*${chainRegex}.*",i](around:${radius},${lat},${lon});
          way["operator"~".*${chainRegex}.*",i](around:${radius},${lat},${lon});
          node["brand"~".*${chainRegex}.*",i](around:${radius},${lat},${lon});
          way["brand"~".*${chainRegex}.*",i](around:${radius},${lat},${lon});
        );
        out center meta;
      `;
    } else {
      // General pharmacy search
      overpassQuery = `
        [out:json][timeout:15];
        (
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          way["amenity"="pharmacy"](around:${radius},${lat},${lon});
          node["shop"="chemist"](around:${radius},${lat},${lon});
          node["name"~".*[Pp]harmacy.*"](around:${radius},${lat},${lon});
          way["name"~".*[Pp]harmacy.*"](around:${radius},${lat},${lon});
        );
        out center meta;
      `;
    }
  }

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)'
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return data.elements || [];

  } catch (error) {
    console.error('Overpass API error:', error);
    return [];
  }
}

function processOverpassResults(
  elements: OverpassElement[],
  originalQuery: string,
  userLat: number,
  userLon: number
): SearchSuggestion[] {
  
  const queryLower = originalQuery.toLowerCase();
  const isAddressSearch = /\d+.*?(street|st|road|rd|avenue|ave|drive|dr|boulevard|blvd|lane|ln|way|circle|cir|court|ct)/i.test(originalQuery);
  
  // Use Map for perfect deduplication by coordinates
  const locationMap = new Map<string, SearchSuggestion>();

  elements.forEach(element => {
    // Get coordinates
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    
    if (!lat || !lon) return;

    // Calculate distance
    const distance = getDistanceInMiles(userLat, userLon, lat, lon);
    if (distance > 50) return; // Skip if too far

    // Enhanced filtering
    if (!isPharmacyElement(element, queryLower, isAddressSearch)) return;

    // Create unique key for deduplication (within 100 meter tolerance)
    const locationKey = `${Math.round(lat * 10000)}_${Math.round(lon * 10000)}`;

    const name = extractName(element);
    const address = buildAddress(element);

    if (!address || address.length < 5) return;

    const suggestion: SearchSuggestion = {
      name: name,
      mapbox_id: `osm_${element.type}_${element.id}`,
      full_address: address,
      distance: distance
    };

    // Only keep the best match for each location
    const existing = locationMap.get(locationKey);
    if (!existing || 
        calculateRelevance(suggestion.name, queryLower) > calculateRelevance(existing.name, queryLower) ||
        (calculateRelevance(suggestion.name, queryLower) === calculateRelevance(existing.name, queryLower) && distance < (existing.distance || Infinity))) {
      locationMap.set(locationKey, suggestion);
    }
  });

  // Convert to array and sort
  return Array.from(locationMap.values())
    .sort((a, b) => {
      // Sort by relevance first, then distance
      const aRelevance = calculateRelevance(a.name, queryLower);
      const bRelevance = calculateRelevance(b.name, queryLower);
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
      
      return (a.distance || 0) - (b.distance || 0);
    })
    .slice(0, 15); // Reasonable limit
}

function isPharmacyElement(element: OverpassElement, queryLower: string, isAddressSearch: boolean): boolean {
  const tags = element.tags;
  const name = (tags.name || '').toLowerCase();
  const operator = (tags.operator || '').toLowerCase();
  const brand = (tags.brand || '').toLowerCase();
  
  // Direct pharmacy classification
  if (tags.amenity === 'pharmacy' || tags.shop === 'chemist') return true;
  
  // Has pharmacy in name/operator/brand
  if (name.includes('pharmacy') || operator.includes('pharmacy') || brand.includes('pharmacy')) return true;
  
  // For address searches, be more inclusive
  if (isAddressSearch) {
    // Check if address matches
    const street = (tags['addr:street'] || '').toLowerCase();
    const houseNumber = tags['addr:housenumber'] || '';
    const fullAddress = `${houseNumber} ${street}`.trim().toLowerCase();
    
    if (fullAddress.includes(queryLower.replace(/[^\w\s]/g, '').toLowerCase())) {
      // If address matches, check if it's likely a pharmacy
      return name.includes('pharmacy') || 
             name.includes('cvs') || 
             name.includes('walgreens') ||
             name.includes('rite aid') ||
             name.includes('walmart') ||
             name.includes('target') ||
             tags.amenity === 'pharmacy';
    }
  }
  
  // Major pharmacy chains
  const chains = ['cvs', 'walgreens', 'rite aid', 'walmart', 'target', 'meijer', 'kroger', 'costco', 'safeway', 'publix'];
  return chains.some(chain => 
    name.includes(chain) || 
    operator.includes(chain) || 
    brand.includes(chain)
  );
}

function extractName(element: OverpassElement): string {
  const tags = element.tags;
  
  // Priority: name > operator > brand
  let name = tags.name || tags.operator || tags.brand || '';
  
  // Clean up the name
  name = name.trim();
  
  // Standardize major chains
  if (name.toLowerCase().includes('walmart')) {
    if (name.toLowerCase().includes('supercenter')) {
      name = 'Walmart Supercenter Pharmacy';
    } else if (name.toLowerCase().includes('neighborhood')) {
      name = 'Walmart Neighborhood Market Pharmacy';
    } else {
      name = 'Walmart Pharmacy';
    }
  } else if (name.toLowerCase().includes('target')) {
    name = 'Target Pharmacy';
  } else if (name.toLowerCase().includes('costco')) {
    name = 'Costco Pharmacy';
  } else if (name.toLowerCase().includes('meijer')) {
    name = 'Meijer Pharmacy';
  }
  
  // Add "Pharmacy" if major chain doesn't have it
  const majorChains = ['walmart', 'target', 'costco', 'meijer', 'kroger', 'safeway'];
  if (majorChains.some(chain => name.toLowerCase().includes(chain)) && 
      !name.toLowerCase().includes('pharmacy')) {
    name += ' Pharmacy';
  }
  
  return name || 'Pharmacy';
}

function buildAddress(element: OverpassElement): string {
  const tags = element.tags;
  const parts = [];
  
  // Street address
  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street']);
  }
  
  // City
  if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }
  
  // ZIP code
  if (tags['addr:postcode']) {
    parts.push(tags['addr:postcode']);
  }
  
  // State
  if (tags['addr:state']) {
    const stateAbbr = getStateAbbreviation(tags['addr:state']);
    parts.push(stateAbbr);
  }
  
  return parts.join(', ');
}

function calculateRelevance(name: string, query: string): number {
  const nameLower = name.toLowerCase();
  
  if (nameLower === query) return 100;
  if (nameLower.startsWith(query)) return 90;
  if (nameLower.includes(query)) return 80;
  
  const queryWords = query.split(' ');
  const matchingWords = queryWords.filter(word => nameLower.includes(word)).length;
  return matchingWords > 0 ? 60 + (matchingWords * 10) : 0;
}

function getStateAbbreviation(stateName: string): string {
  const states: Record<string, string> = {
    'Michigan': 'MI', 'Ohio': 'OH', 'Wisconsin': 'WI', 'Illinois': 'IL', 'Indiana': 'IN',
    'Pennsylvania': 'PA', 'New York': 'NY', 'California': 'CA', 'Texas': 'TX', 'Florida': 'FL',
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'Colorado': 'CO',
    'Connecticut': 'CT', 'Delaware': 'DE', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
    'Maryland': 'MD', 'Massachusetts': 'MA', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
    'Tennessee': 'TN', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
    'West Virginia': 'WV', 'Wyoming': 'WY'
  };
  
  return states[stateName] || stateName.substring(0, 2).toUpperCase();
}

function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Keep existing POST handler for compatibility
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pharmacy_id } = body;

    if (!pharmacy_id || !pharmacy_id.startsWith('osm_')) {
      return NextResponse.json({ error: 'Invalid pharmacy ID' }, { status: 400 });
    }

    const [, osmType, osmId] = pharmacy_id.split('_');
    
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

    if (!response.ok) throw new Error(`Lookup error: ${response.status}`);

    const details = await response.json();
    if (!details || details.length === 0) throw new Error('No details found');

    const result = details[0];
    
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
    return NextResponse.json({ error: 'Failed to get pharmacy details' }, { status: 500 });
  }
}