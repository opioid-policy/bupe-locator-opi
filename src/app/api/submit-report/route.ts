// src/app/api/submit-report/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ...reportData } = body; // We no longer need the turnstileToken here

  // --- Turnstile Verification is Temporarily Disabled ---
  /*
  try {
    // ... all turnstile code is commented out ...
  } catch (error) {
    // ...
  }
  */
  // --- End of Disabled Section ---


  // The code will now go directly to the Airtable section
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