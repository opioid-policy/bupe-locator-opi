// src/app/api/submit-report/route.ts
import { NextRequest, NextResponse } from 'next/server';

// --- Config ---
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID}/${process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// --- CORS Middleware ---
const allowedOrigins = [
  /\.opioidpolicy\.org$/, // All subdomains of opioidpolicy.org
  'http://localhost:3000', // Development
];

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const defaultHeaders = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!origin) return defaultHeaders;

  const isAllowed = allowedOrigins.some(allowedOrigin =>
    typeof allowedOrigin === 'string'
      ? origin === allowedOrigin
      : allowedOrigin.test(origin)
  );

  return isAllowed
    ? {
        ...defaultHeaders,
        'Access-Control-Allow-Origin': origin,
      }
    : defaultHeaders;
}

// Handle OPTIONS for preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const body = await request.json();
    const { turnstileToken, ...reportData } = body;

    // --- Turnstile Verification ---
    if (!turnstileToken) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Turnstile token missing'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY!);
    formData.append('response', turnstileToken);

    const verificationResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const verificationData = await verificationResponse.json();

    if (!verificationData?.success) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Turnstile verification failed'
      }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // --- Sanitize only the notes field ---
    const sanitize = (input: string | undefined) => input ? input.replace(/[<>"']/g, '') : undefined;

    // --- Airtable Submission ---
    const airtableRecord = {
      records: [{
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
          standardized_notes: reportData.standardizedNotes, // Not sanitized as it's a checklist
          notes: sanitize(reportData.notes), // Only sanitize the free-text notes
        },
      }],
    };

    // Log the payload being sent to Airtable for debugging

    const response = await fetch(AIRTABLE_API_URL, {
      method: 'POST',
      headers: AIRTABLE_HEADERS,
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Airtable error details:', errorData);

      // Return more detailed error information
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Failed to save report',
        airtableError: errorData.error || `Airtable returned status ${response.status}`,
        status: response.status
      }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    const result = await response.json();

    return new NextResponse(JSON.stringify({
      success: true,
      recordId: result.records[0]?.id,
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Submission error:', error instanceof Error ? error.message : String(error));
    return new NextResponse(JSON.stringify({
      success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
