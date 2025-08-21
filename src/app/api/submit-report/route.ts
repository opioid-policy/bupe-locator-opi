// src/app/api/submit-report/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Direct Airtable API configuration
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID}/${process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken, ...reportData } = body;

  // --- Start Turnstile Verification (unchanged) ---
  if (!turnstileToken) {
    console.error('Turnstile token missing from request.');
    return NextResponse.json({ error: 'Turnstile token missing.' }, { status: 400 });
  }

  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY!);
  formData.append('response', turnstileToken);

  let verificationData;
  try {
    const verificationResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    verificationData = await verificationResponse.json();
  } catch (error) {
    console.error('Error contacting Turnstile verification endpoint:', error);
    return NextResponse.json({ error: 'Turnstile verification error.' }, { status: 500 });
  }

  if (!verificationData?.success) {
    console.error('Turnstile verification failed:', verificationData?.['error-codes']);
    return NextResponse.json({ error: 'Turnstile verification failed.' }, { status: 403 });
  }
  // --- End Turnstile Verification ---

  try {
    if (!reportData.pharmacy) {
      return NextResponse.json({ error: 'Pharmacy data is missing.' }, { status: 400 });
    }

    // Prepare the record for Airtable
    const airtableRecord = {
      records: [
        {
          fields: {
            pharmacy_id: reportData.pharmacy.osm_id,
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
          },
        },
      ],
    };

// Debug: Check for duplicate submissions
console.log(`[${new Date().toISOString()}] Submitting report for: ${reportData.pharmacy.osm_id || reportData.pharmacy.mapbox_id}`);
console.log('Call stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'));

    // Make direct API call to Airtable
    const response = await fetch(AIRTABLE_API_URL, {
      method: 'POST',
      headers: AIRTABLE_HEADERS,
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      
      // Enhanced error handling for common issues
      if (response.status === 401) {
        console.error('Invalid Airtable API token');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }
      if (response.status === 404) {
        console.error('Airtable base or table not found');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }
      if (response.status === 422) {
        console.error('Invalid field data:', errorData.error);
        return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
      }
      
      throw new Error(`Airtable API returned ${response.status}`);
    }

    const result = await response.json();
    
    // Log success (remove in production)
    console.log('Successfully created record:', result.records[0]?.id);
    
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error saving to Airtable:', error);
    return NextResponse.json({ error: 'Failed to save report.' }, { status: 500 });
  }
}