// src/app/api/pharmacies/route.ts

import { airtableAPI } from '@/lib/airtable-api';
import { NextRequest, NextResponse } from 'next/server';

function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959; 
  const dLat = (lat2 - lat1) * Math.PI / 180; 
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Set cache headers to be shorter for immediate updates
  const headers = {
    'Cache-Control': 'public, max-age=60, s-maxage=60', // 1 minute cache
    'CDN-Cache-Control': 'max-age=60', // Vercel CDN cache
  };

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required.' }, 
      { status: 400, headers }
    );
  }

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);

  try {
    const allRecords = await airtableAPI.select({
      fields: [
        'pharmacy_id', 'pharmacy_name', 'report_type', 
        'latitude', 'longitude', 'submission_time', 
        'street_address', 'city', 'state', 'zip_code', 
        'phone_number', 'standardized_notes'
      ],
      filterByFormula: `AND(NOT({latitude} = ''), NOT({longitude} = ''))`
    });

      const allReports = allRecords.map(record => ({
        pharmacyId: record.fields.pharmacy_id,
        pharmacyName: record.fields.pharmacy_name,
        reportType: record.fields.report_type,
        latitude: record.fields.latitude,
        longitude: record.fields.longitude,
        submissionTime: record.fields.submission_time,
        streetAddress: record.fields.street_address,
        city: record.fields.city,
        state: record.fields.state,
        zipCode: record.fields.zip_code,
        phoneNumber: record.fields.phone_number,
        standardizedNotes: record.fields.standardized_notes || [],
      }));
    
    const nearbyReports = allReports.filter(report => {
      const distance = getDistanceInMiles(
        userLat, userLon, 
        report.latitude as number, 
        report.longitude as number
      );
      return distance <= 50;
    });

    return NextResponse.json(nearbyReports, { headers });

  } catch (error) {
    console.error("Error fetching pharmacy data from Airtable:", error);
    return NextResponse.json([], { status: 500, headers });
  }
}