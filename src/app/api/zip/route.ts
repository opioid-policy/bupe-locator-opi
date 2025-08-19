// src/app/api/zip/route.ts
import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import NodeCache from 'node-cache';

// Nominatim API types
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
  importance: number;
  addresstype?: string;
}

// Response format for ZIP code lookup
interface ZipCodeResponse {
  type: string;
  features: Array<{
    center: [number, number];
    place_name: string;
  }>;
}

// Respectful rate limiting for Nominatim (1 req/sec max)
const globalRateLimiter = new RateLimiterMemory({
  points: 1,
  duration: 1,
});

// Cache for 24 hours (ZIP codes don't change often)
const cache = new NodeCache({ stdTTL: 86400 });

function validateZipCode(zipCode: string | null): zipCode is string {
  return !!zipCode && /^\d{5}$/.test(zipCode);
}

export async function GET(request: Request) {
  try {
    // Apply respectful rate limiting
    await globalRateLimiter.consume('nominatim');

    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode');

    if (!validateZipCode(zipCode)) {
      return NextResponse.json(
        { error: 'Please provide a valid 5-digit ZIP code' }, 
        { status: 400 }
      );
    }

    // Check cache first
    const cachedData = cache.get<ZipCodeResponse>(zipCode);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'X-Data-Source': 'cache'
        }
      });
    }

    // Query Nominatim for ZIP code
    const endpoint = `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5&` +
      `countrycodes=us&` +
      `postalcode=${zipCode}&` +
      `addressdetails=1`;
    
    console.log(`Querying Nominatim for ZIP: ${zipCode}`);
    
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; code@opioidpolicy.org)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch location data' }, 
        { status: response.status }
      );
    }

    const data: NominatimResult[] = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No location found for that ZIP code' }, 
        { status: 404 }
      );
    }

    // Find the best match (usually first result, but filter for postal codes)
    const bestMatch = data.find(result => 
      result.addresstype === 'postcode' || 
      result.display_name.toLowerCase().includes('postal')
    ) || data[0];

    // Format response
    const responseData: ZipCodeResponse = {
      type: "FeatureCollection",
      features: [{
        center: [parseFloat(bestMatch.lon), parseFloat(bestMatch.lat)],
        place_name: bestMatch.display_name
      }]
    };

    // Cache the response
    cache.set(zipCode, responseData);

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'X-Data-Source': 'nominatim'
      }
    });

  } catch (error) {
    console.error('ZIP Code API Error:', error);
    
    if (error instanceof Error && error.message.includes('Cannot consume')) {
      return NextResponse.json(
        { error: 'Please wait a moment before trying again' }, 
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}