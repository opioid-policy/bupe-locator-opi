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
      return new NextResponse('Please provide a valid 5-digit ZIP code', { status: 400 });
    }

    // Check cache first
    const cachedData = cache.get<string>(zipCode);
    if (cachedData) {
      return new NextResponse(JSON.parse(cachedData), {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': String(await globalRateLimiter.get('global_key'))
        }
      });
    }

    // Call Mapbox
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      return new NextResponse('Server misconfiguration', { status: 500 });
    }

    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${accessToken}&types=postcode`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      return new NextResponse('Failed to fetch location data', { status: response.status });
    }

    const data: MapboxGeocodingResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return new NextResponse('No location found for that ZIP code', { status: 404 });
    }

    // Cache the response
    cache.set(zipCode, JSON.stringify(data));

    // Return with headers
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': String(await globalRateLimiter.get('global_key'))
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot consume')) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
