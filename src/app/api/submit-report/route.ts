// src/app/api/submit-report/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken, ...reportData } = body;

  if (!turnstileToken) {
    return NextResponse.json({ error: 'Turnstile token is missing.' }, { status: 400 });
  }

  // --- Start Turnstile Verification ---
  let turnstileResponse;
  try {
    const formData = new FormData();
    formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!);
    formData.append('response', turnstileToken);
    
    turnstileResponse = await fetch('https://challenges.cloudflare.com/api/turnstile/v2/siteverify', {
      method: 'POST',
      body: formData,
    });

    const turnstileData = await turnstileResponse.json();

    if (!turnstileData.success) {
      console.error('Turnstile verification was not successful:', turnstileData['error-codes']);
      return NextResponse.json({ error: 'Turnstile check failed.', details: turnstileData['error-codes'] }, { status: 403 });
    }
  } catch (error) {
    console.error('CRITICAL: Error during Turnstile verification fetch or JSON parsing:', error);
    // If the response exists but wasn't valid JSON, log its raw text
    if (turnstileResponse) {
      const rawText = await turnstileResponse.text().catch(() => "Could not read response text.");
      console.error("Raw response text from Cloudflare:", rawText);
    }
    return NextResponse.json({ error: 'Could not verify Turnstile token.' }, { status: 500 });
  }
  // --- End Turnstile Verification ---

  // If we get here, Turnstile was successful. Now, save to Airtable.
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