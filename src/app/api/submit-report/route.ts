// src/app/api/submit-report/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios'; // NEW: Import axios

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken, ...reportData } = body;

  // --- Start Turnstile Verification using Axios ---
  try {
    if (!turnstileToken) {
      throw new Error("Turnstile token is missing.");
    }
    
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Cloudflare secret key is not configured.");
    }

    // Axios handles URL-encoded forms easily with a simple object
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', turnstileToken);

    const turnstileResponse = await axios.post(
      'https://challenges.cloudflare.com/api/turnstile/v2/siteverify',
      params
    );

    const turnstileData = turnstileResponse.data;

    if (!turnstileData.success) {
      console.error('Turnstile verification was not successful:', turnstileData['error-codes']);
      return NextResponse.json({ error: 'Turnstile check failed.' }, { status: 403 });
    }
  } catch (error) {
    console.error('CRITICAL: Error during Turnstile verification:', error);
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