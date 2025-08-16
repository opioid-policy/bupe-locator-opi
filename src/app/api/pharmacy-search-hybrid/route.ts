// src/app/api/pharmacy-search-hybrid/route.ts
import { NextResponse } from 'next/server';
import { table } from '@/lib/airtable';
import NodeCache from 'node-cache';

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

// Cache Airtable results for 5 minutes to improve speed
const airtableCache = new NodeCache({ stdTTL: 600 }); // 10 minutes instead of 5
const osmCache = new NodeCache({ stdTTL: 300 }); // Cache OSM results too

// Get unique pharmacies from Airtable (manual entries + reported ones)
async function getAirtablePharmacies(lat: number, lon: number): Promise<AirtablePharmacy[]> {
  // Check cache first
  const cacheKey = `airtable_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = airtableCache.get<AirtablePharmacy[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Get all pharmacy records from Airtable
    const records = await table.select({
      fields: [
        'pharmacy_id', 'pharmacy_name', 'street_address', 
        'city', 'state', 'zip_code', 'latitude', 'longitude', 
        'phone_number', 'manual_entry', 'live_manual_entry', 'submission_time'
      ],
      filterByFormula: `AND(NOT({latitude} = ''), NOT({longitude} = ''))`
    }).all();

    // Group by pharmacy_id to get unique pharmacies
    const pharmacyMap = new Map<string, AirtablePharmacy>();
    
    records.forEach(record => {
      const pharmacyId = record.get('pharmacy_id') as string;
      const lat = record.get('latitude') as number;
      const lon = record.get('longitude') as number;
      const isManualEntry = record.get('manual_entry') === true;
      const isLiveManualEntry = record.get('live_manual_entry') === true;
      
      // Skip manual entries that aren't approved (live)
      if (isManualEntry && !isLiveManualEntry) {
        return; // Skip this record
      }
      
      // Skip if no valid coordinates
      if (!lat || !lon) return;
      
      // Only include if not already in map or if this is newer
      if (!pharmacyMap.has(pharmacyId) || 
          (record.get('submission_time') as string) > (pharmacyMap.get(pharmacyId)?.last_report || '')) {
        
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
          manual_entry: isManualEntry,
          live_manual_entry: isLiveManualEntry,
          last_report: record.get('submission_time') as string
        });
      }
    });

    // Filter by distance (50 miles)
    const nearbyPharmacies = Array.from(pharmacyMap.values()).filter(pharmacy => {
      const distance = getDistanceInMiles(lat, lon, pharmacy.latitude, pharmacy.longitude);
      return distance <= 50;
    });

    // Cache the results
    airtableCache.set(cacheKey, nearbyPharmacies);

    return nearbyPharmacies;
  } catch (error) {
    console.error('Error fetching Airtable pharmacies:', error);
    return [];
  }
}

function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if two pharmacies are likely the same
function similarPharmacy(pharmacy1: SearchSuggestion, pharmacy2: SearchSuggestion): boolean {
  // Clean and compare names
  const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const name1 = clean(pharmacy1.name);
  const name2 = clean(pharmacy2.name);
  
  // Check if names are very similar
  if (name1 === name2 || 
      (name1.includes(name2) && name2.length > 3) || 
      (name2.includes(name1) && name1.length > 3)) {
    
    // Check address similarity
    const addr1 = pharmacy1.full_address.toLowerCase();
    const addr2 = pharmacy2.full_address.toLowerCase();
    
    // Extract street numbers
    const num1 = addr1.match(/^\d+/)?.[0];
    const num2 = addr2.match(/^\d+/)?.[0];
    
    // If same street number and similar name, likely duplicate
    if (num1 && num2 && num1 === num2) {
      return true;
    }
    
    // Check if addresses are very similar (for pharmacies without street numbers)
    const cleanAddr1 = clean(addr1);
    const cleanAddr2 = clean(addr2);
    const overlap = cleanAddr1.split('').filter((char, i) => cleanAddr2[i] === char).length;
    const similarity = overlap / Math.max(cleanAddr1.length, cleanAddr2.length);
    
    if (similarity > 0.8) {
      return true; // 80% similar addresses with similar names
    }
  }
  
  return false;
}

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

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Parallel fetch: OSM and Airtable data simultaneously for speed
    const [osmResponse, airtablePharmacies] = await Promise.all([
      // Call existing pharmacy-search endpoint
      fetch(`${request.url.split('/api/')[0]}/api/pharmacy-search?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}`),
      // Get Airtable pharmacies
      getAirtablePharmacies(latitude, longitude)
    ]);

    const osmData = await osmResponse.json();
    let suggestions: SearchSuggestion[] = osmData.suggestions || [];

    // Mark OSM results with source
    suggestions = suggestions.map(s => ({
      ...s,
      source: s.mapbox_id === 'manual_entry' ? 'action' : 'osm'
    })) as SearchSuggestion[];

    // Remove the manual_entry option from OSM results (we'll add it at the end)
    suggestions = suggestions.filter(s => s.mapbox_id !== 'manual_entry');

    // Filter Airtable results by search query
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);
    
    const matchingAirtable = airtablePharmacies.filter(pharmacy => {
      const searchText = `${pharmacy.name} ${pharmacy.street_address} ${pharmacy.city}`.toLowerCase();
      // Check if all query terms appear in the pharmacy data
      return queryTerms.every(term => searchText.includes(term));
    });

    // Convert Airtable format to match suggestion format
    const airtableSuggestions: SearchSuggestion[] = matchingAirtable.map(pharmacy => ({
      name: pharmacy.name,
      mapbox_id: pharmacy.id,
      full_address: `${pharmacy.street_address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip_code}`.replace(/^,\s*/, ''),
      source: pharmacy.manual_entry ? 'manual' : 'reported',
      phone_number: pharmacy.phone_number
    }));

    // Merge results, prioritizing OSM but including unique Airtable entries
    const mergedSuggestions: SearchSuggestion[] = [...suggestions];
    
    // Add Airtable results that aren't duplicates
    airtableSuggestions.forEach(airtableItem => {
      const isDuplicate = mergedSuggestions.some(existingItem => 
        similarPharmacy(existingItem, airtableItem)
      );
      
      if (!isDuplicate) {
        // Insert manual entries higher in the list
        if (airtableItem.source === 'manual') {
          // Place manual entries after OSM but before reported
          const insertIndex = mergedSuggestions.findIndex(s => s.source === 'reported');
          if (insertIndex >= 0) {
            mergedSuggestions.splice(insertIndex, 0, airtableItem);
          } else {
            mergedSuggestions.push(airtableItem);
          }
        } else {
          mergedSuggestions.push(airtableItem);
        }
      }
    });

    // Sort by relevance and distance
    mergedSuggestions.sort((a, b) => {
      // Exact name matches first
      const aExact = a.name.toLowerCase() === queryLower;
      const bExact = b.name.toLowerCase() === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by source priority: OSM > manual > reported
      const sourcePriority: Record<string, number> = { 
        'osm': 0, 
        'manual': 1, 
        'reported': 2,
        'action': 3 
      };
      const aPriority = sourcePriority[a.source || 'osm'] || 3;
      const bPriority = sourcePriority[b.source || 'osm'] || 3;
      
      return aPriority - bPriority;
    });

    // Limit to 5 results before adding the manual entry option (reduced from 15)
    const topResults = mergedSuggestions.slice(0, 5);

    // Always add manual entry option at the end
    topResults.push({
      name: '+ Add a pharmacy not listed',
      mapbox_id: 'manual_entry',
      full_address: 'Can\'t find your pharmacy? Add it to help others',
      source: 'action'
    });

    return NextResponse.json({ 
      suggestions: topResults,
      sources: {
        osm: suggestions.length,
        airtable: airtableSuggestions.length,
        total: topResults.length - 1 // Minus the add option
      },
      cached: osmData.cached || false
    });

  } catch (error) {
    console.error('Hybrid search error:', error);
    
    // Fallback to OSM-only search if hybrid fails
    try {
      const fallbackResponse = await fetch(
        `${request.url.split('/api/')[0]}/api/pharmacy-search?q=${request.url.split('q=')[1]}`
      );
      const fallbackData = await fallbackResponse.json();
      
      // Ensure manual entry option is present
            if (!fallbackData.suggestions.some((s: SearchSuggestion) => s.mapbox_id === 'manual_entry')) {        fallbackData.suggestions.push({
          name: '+ Add a pharmacy not listed',
          mapbox_id: 'manual_entry',
          full_address: 'Can\'t find your pharmacy? Add it to help others',
          source: 'action'
        });
      }
      
      return NextResponse.json(fallbackData);
    } catch {
      return NextResponse.json({ 
        suggestions: [{
          name: '+ Add a pharmacy not listed',
          mapbox_id: 'manual_entry',
          full_address: 'Search unavailable - you can still add manually',
          source: 'action'
        }]
      });
    }
  }
}