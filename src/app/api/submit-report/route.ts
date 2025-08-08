// src/app/api/submit-report/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken, ...reportData } = body;

  // --- Start Turnstile Verification ---
  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY!);
  formData.append('response', turnstileToken);

  const verificationResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const verificationData = await verificationResponse.json();

  if (!verificationData.success) {
    console.error('Turnstile verification failed:', verificationData['error-codes']);
    return NextResponse.json({ error: 'Turnstile verification failed.' }, { status: 403 });
  }
  // --- End Turnstile Verification ---

  try {
    if (!reportData.pharmacy) {
      return NextResponse.json({ error: 'Pharmacy data is missing.' }, { status: 400 });
    }

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