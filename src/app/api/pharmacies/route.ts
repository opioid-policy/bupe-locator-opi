// src/app/api/pharmacies/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';

function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
  }

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);

  try {
    const allRecords = await table.select({
      fields: ['pharmacy_id', 'pharmacy_name', 'report_type', 'latitude', 'longitude', 'submission_time', 'street_address', 'city', 'state', 'zip_code', 'phone_number', 'standardized_notes'], // UPDATED
      filterByFormula: `AND(NOT({latitude} = ''), NOT({longitude} = ''))`
    }).all();

    const allReports = allRecords.map(record => ({
      pharmacyId: record.get('pharmacy_id'),
      pharmacyName: record.get('pharmacy_name'),
      reportType: record.get('report_type'),
      latitude: record.get('latitude'),
      longitude: record.get('longitude'),
      submissionTime: record.get('submission_time'),
      streetAddress: record.get('street_address'),
      city: record.get('city'),
      state: record.get('state'),
      zipCode: record.get('zip_code'),
      phoneNumber: record.get('phone_number'),
      standardizedNotes: record.get('standardized_notes') || [], // UPDATED
    }));
    
    const nearbyReports = allReports.filter(report => {
      const distance = getDistanceInMiles(userLat, userLon, report.latitude as number, report.longitude as number);
      return distance <= 50;
    });

    return NextResponse.json(nearbyReports);

  } catch (error) {
    console.error("Error fetching pharmacy data from Airtable:", error);
    return NextResponse.json([], { status: 500 });
  }
}