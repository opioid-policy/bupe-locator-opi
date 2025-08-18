// src/app/api/zip/route.ts - Fully replaced with Nominatim
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

// Keep your existing response format for compatibility
interface MapboxGeocodingResponse {
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
  return !!(zipCode && /^\d{5}$/.test(zipCode));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode');

  // Validate ZIP code format
  if (!validateZipCode(zipCode)) {
    return NextResponse.json(
      { message: 'Invalid ZIP code format. Please provide a 5-digit ZIP code.' },
      { status: 400 }
    );
  }

  try {
    // Apply rate limiting
    await globalRateLimiter.consume('global');

    // Check cache first
    const cachedData = cache.get<MapboxGeocodingResponse>(zipCode);
      if (cachedData) {
        console.log(`Cache hit for ZIP: ${zipCode}`);
        return new NextResponse(JSON.stringify(cachedData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=604800, immutable',
            'X-Cache': 'HIT',
          },
        });
      }

    // Query Nominatim for the ZIP code
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
      `postalcode=${zipCode}&` +
      `country=United States&` +
      `format=json&` +
      `limit=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'BupeLocator/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return NextResponse.json(
        { message: 'Failed to fetch location data.' },
        { status: 500 }
      );
    }

    const data: NominatimResult[] = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({
        type: 'FeatureCollection',
        features: []
      });
    }

    // Format response to match existing Mapbox format
    const formattedResponse: MapboxGeocodingResponse = {
      type: 'FeatureCollection',
      features: [{
        center: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
        place_name: data[0].display_name
      }]
    };

    // Cache the result
    cache.set(zipCode, formattedResponse);

return new NextResponse(JSON.stringify(formattedResponse), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=604800, immutable',
    'X-Cache': 'MISS',
  },
});

  } catch (error) {
    console.error('ZIP lookup error:', error);
    
    // Check for rate limiting
    if (error instanceof Error && error.message.includes('Too Many Requests')) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to fetch location data.' },
      { status: 500 }
    );
  }
}