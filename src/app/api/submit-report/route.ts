// src/app/api/submit-report/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  // The 'turnstileToken' is intentionally unused in development, which is expected.
  const { turnstileToken, ...reportData } = body;

  if (process.env.NODE_ENV === 'production') {
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Turnstile token is missing.' }, { status: 400 });
    }
    const formData = new FormData();
    formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!);
    formData.append('response', turnstileToken);
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/api/turnstile/v2/siteverify', {
      method: 'POST',
      body: formData,
    });
    const turnstileData = await turnstileResponse.json();
    if (!turnstileData.success) {
      console.error('Turnstile verification failed:', turnstileData['error-codes']);
      return NextResponse.json({ error: 'Turnstile verification failed.' }, { status: 403 });
    }
  }

  // THIS IS THE FIX: Add a guard clause to ensure pharmacy data exists.
  if (!reportData.pharmacy) {
    return NextResponse.json({ error: 'Pharmacy data is missing.' }, { status: 400 });
  }

  try {
    await table.create([
      {
        fields: {
          pharmacy_id: reportData.pharmacy.mapbox_id,
          pharmacy_name: reportData.pharmacy.name,
          street_address: reportData.pharmacy.street_address,
          city: reportData.pharmacy.city,
          state: reportData.pharmacy.state,
          zip_code: reportData.pharmacy.zip_code,
          latitude: reportData.pharmacy.latitude,
          longitude: reportData.pharmacy.longitude,
          phone_number: reportData.pharmacy.phone_number,
          report_type: reportData.reportType,
          formulation: reportData.formulations,
          standardized_notes: reportData.standardizedNotes,
          notes: reportData.notes,
          consent_research: reportData.consentResearch,
        },
      },
    ]);
    
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error saving to Airtable:', error);
    return NextResponse.json({ error: 'Failed to save report.' }, { status: 500 });
  }
}