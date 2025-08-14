// src/app/api/zip/route.ts
import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import NodeCache from 'node-cache';

// Define types for better type safety
interface MapboxFeature {
  center: [number, number];
  place_name: string;
}

interface MapboxGeocodingResponse {
  type: string;
  features: MapboxFeature[];
}

// Global rate limiter
const globalRateLimiter = new RateLimiterMemory({
  points: 50,
  duration: 60,
});

// Cache for responses
const cache = new NodeCache({ stdTTL: 3600 });

// Input validation function
function validateZipCode(zipCode: string | null): zipCode is string {
  return !!zipCode && /^\d{5}$/.test(zipCode);
}

export async function GET(request: Request) {
  try {
    // Apply global rate limit
    await globalRateLimiter.consume('global_key');

    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode');

    // Validate ZIP code
    if (!validateZipCode(zipCode)) {
      return NextResponse.json(
        { error: 'Please provide a valid 5-digit ZIP code' }, 
        { status: 400 }
      );
    }

    // Check cache first
    const cachedData = cache.get<MapboxGeocodingResponse>(zipCode);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '50'
        }
      });
    }

    // Call Mapbox
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('MAPBOX_ACCESS_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration' }, 
        { status: 500 }
      );
    }

    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${accessToken}&types=postcode`;
    
    console.log(`Fetching: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.error(`Mapbox API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch location data' }, 
        { status: response.status }
      );
    }

    const data: MapboxGeocodingResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: 'No location found for that ZIP code' }, 
        { status: 404 }
      );
    }

    // Cache the response (store the actual object, not stringified)
    cache.set(zipCode, data);

    // Return with headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': '50'
      }
    });

  } catch (error) {
    console.error('API Route Error:', error);
    
    if (error instanceof Error && error.message.includes('Cannot consume')) {
      return NextResponse.json(
        { error: 'Too Many Requests' }, 
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}