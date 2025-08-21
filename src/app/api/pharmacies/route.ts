// src/app/api/pharmacies/route.ts
import { airtableAPI } from '@/lib/airtable-api';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Constants
const MAX_DISTANCE_MILES = 15;
const EARTH_RADIUS_MILES = 3959;
const DEGREE_TO_RAD = Math.PI / 180;

// Generate consistent cache key from coordinates
function generateCacheKey(lat: number, lon: number): string {
  return createHash('sha256')
    .update(`${lat},${lon}`)
    .digest('hex')
    .substring(0, 8);
}

// Optimized Haversine formula
function getDistanceInMiles(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const lat1Rad = lat1 * DEGREE_TO_RAD;
  const lat2Rad = lat2 * DEGREE_TO_RAD;
  const dLat = lat2Rad - lat1Rad;
  const dLon = (lon2 - lon1) * DEGREE_TO_RAD;

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

// Type definition for pharmacy records
interface PharmacyReport {
  pharmacyId: string;
  pharmacyName: string;
  reportType: string;
  latitude: number;
  longitude: number;
  submissionTime: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  standardizedNotes: string[];
  distance: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat')!);
  const lon = parseFloat(searchParams.get('lon')!);

  const cacheKey = generateCacheKey(lat, lon);
  const headers = {
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'CDN-Cache-Control': 'max-age=60',
    'x-cache-key': cacheKey,
  };

  try {
    const allRecords = await airtableAPI.select({
      fields: [
        'pharmacy_id', 'pharmacy_name', 'report_type',
        'latitude', 'longitude', 'submission_time',
        'street_address', 'city', 'state', 'zip_code',
        'phone_number', 'standardized_notes'
      ]
    });

    // Type-safe transformation with proper type assertions
    const allReports: PharmacyReport[] = allRecords.map(record => ({
      pharmacyId: record.fields.pharmacy_id as string,
      pharmacyName: record.fields.pharmacy_name as string,
      reportType: record.fields.report_type as string,
      latitude: record.fields.latitude as number,
      longitude: record.fields.longitude as number,
      submissionTime: record.fields.submission_time as string,
      streetAddress: record.fields.street_address as string,
      city: record.fields.city as string,
      state: record.fields.state as string,
      zipCode: record.fields.zip_code as string,
      phoneNumber: record.fields.phone_number as string,
      standardizedNotes: (record.fields.standardized_notes as string[]) || [],
      distance: 0,
    }));

    const nearbyReports = allReports
      .map(report => ({
        ...report,
        distance: getDistanceInMiles(
          lat, lon,
          report.latitude,
          report.longitude
        ),
      }))
      .filter(report => report.distance <= MAX_DISTANCE_MILES)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(nearbyReports, { headers });

  } catch (error) {
    console.error('Error fetching pharmacy data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacy data.' },
      { status: 500, headers }
    );
  }
}
