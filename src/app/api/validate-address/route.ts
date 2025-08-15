// src/app/api/validate-address/route.ts
import { NextResponse } from 'next/server';

// Comprehensive list of pharmacy-related keywords
const PHARMACY_KEYWORDS = [
  // Generic pharmacy terms
  'pharmacy', 'drug', 'drugs', 'drugstore', 'apothecary', 'chemist', 'rx', 'meds',
  'prescriptions', 'pharmaceutical', 'medicin', 'health', 'wellness',
  
  // Major pharmacy chains
  'cvs', 'walgreens', 'rite aid', 'duane reade', 'medicine shoppe', 
  'healthmart', 'genoa', 'capsule', 'express scripts', 'caremark',
  
  // Grocery stores with pharmacies
  'walmart', 'target', 'kroger', 'safeway', 'albertsons', 'vons', 
  'pavilions', 'randalls', 'tom thumb', 'acme', 'jewel-osco', 'jewel', 'osco',
  'shaw\'s', 'shaws', 'star market', 'meijer', 'publix', 'wegmans', 
  'h-e-b', 'heb', 'hy-vee', 'hyvee', 'giant', 'giant eagle', 'stop & shop', 
  'harris teeter', 'food lion', 'fred meyer', 'qfc', 'smith\'s', 'smiths',
  'king soopers', 'city market', 'fry\'s', 'frys', 'ralphs', 'dillons', 
  'baker\'s', 'bakers', 'gerbes', 'pick \'n save', 'metro market', 
  'mariano\'s', 'marianos', 'whole foods', 'sam\'s club', 'sams club', 
  'costco', 'bj\'s', 'bjs', 'price chopper', 'market basket', 'shoprite', 
  'winn-dixie', 'ingles', 'food city', 'brookshire\'s', 'brookshires',
  'united supermarkets', 'market street', 'amigos', 'carrs', 'hannaford',
  'price rite', 'tops', 'weis', 'martin\'s', 'martins', 'food giant', 
  'piggly wiggly', 'bi-lo', 'bilo', 'harveys', 'fresco',
  
  // Hospital/Medical center pharmacies
  'hospital', 'medical center', 'medical', 'clinic', 'health center',
  'outpatient', 'infusion', 'specialty',
  
  // Independent pharmacy indicators
  'corner', 'family', 'community', 'neighborhood', 'local', 'discount',
  'care', 'script', 'pharm', 'med', 'health', 'drug mart', 'drug fair'
];

interface AddressValidationResult {
  valid: boolean;
  coordinates?: [number, number];
  normalized_address?: string;
  suggestions?: Array<{
    full_address: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  }>;
  error?: string;
  is_pharmacy?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const pharmacyName = searchParams.get('name'); // Optional pharmacy name for validation

    if (!address) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Address required' 
      });
    }

    // If pharmacy name provided, validate it
    if (pharmacyName) {
      const nameLower = pharmacyName.toLowerCase();
      const hasPharmacyKeyword = PHARMACY_KEYWORDS.some(keyword => 
        nameLower.includes(keyword)
      );
      
      // Also accept if it explicitly says it's a pharmacy or has Rx/medication references
      const explicitPharmacy = 
        nameLower.includes('compound') ||
        nameLower.includes('specialty') ||
        nameLower.includes('independent') ||
        /\brx\b/i.test(pharmacyName) ||
        /pharm/i.test(pharmacyName);
      
      if (!hasPharmacyKeyword && !explicitPharmacy) {
        // Check if the name might be an independent pharmacy (often named after owner/location)
        // Allow if address contains pharmacy keywords
        const addressLower = address.toLowerCase();
        const addressHasPharmacy = PHARMACY_KEYWORDS.some(keyword => 
          addressLower.includes(keyword)
        );
        
        if (!addressHasPharmacy) {
          return NextResponse.json({ 
            valid: false, 
            error: 'This doesn\'t appear to be a pharmacy. Please ensure you\'re adding a licensed pharmacy that dispenses prescription medications.',
            is_pharmacy: false
          });
        }
      }
    }

    // Use Nominatim to validate and geocode the address
    const endpoint = `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(address)}&` +
      `addressdetails=1&` +
      `limit=5&` +
      `countrycodes=us`;

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Geocoding service error' 
      });
    }

    const results = await response.json();

    if (results && results.length > 0) {
      // Address found - return coordinates
      const bestMatch = results[0];
      
      // Check if the result is actually in the US
      if (!bestMatch.display_name.includes('United States')) {
        return NextResponse.json({
          valid: false,
          error: 'Please enter a US address',
          suggestions: []
        });
      }
      
      return NextResponse.json({
        valid: true,
        coordinates: [parseFloat(bestMatch.lat), parseFloat(bestMatch.lon)],
        normalized_address: bestMatch.display_name,
        is_pharmacy: true
      });
    } else {
      // No exact match - provide error
      return NextResponse.json({
        valid: false,
        error: 'Address not found. Please check the address and try again.',
        suggestions: []
      });
    }
  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Validation service temporarily unavailable. Please try again.' 
    });
  }
}