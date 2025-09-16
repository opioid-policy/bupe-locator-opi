// src/app/api/submit-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mapLabelsToKeys } from '@/lib/form-options';

// --- Config ---
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// --- CORS Middleware ---
// Simplified CORS that actually works
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';

  // Always return these headers
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
    headers['Access-Control-Allow-Origin'] = origin;
    return headers;
  }

  // In production, allow your domains
  if (origin.includes('opioidpolicy.org') || origin.includes('findbupe.org')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
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

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10240) {
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Request too large'
    }), {
      status: 413,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.clone().json();
    const { turnstileToken, ...reportData } = body;

    if (!reportData.pharmacy?.osm_id || !reportData.reportType) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate report type
    if (!['success', 'denial'].includes(reportData.reportType)) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Invalid report type'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

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
    console.log('Turnstile verification:', {
      success: verificationData?.success,
      token: turnstileToken?.substring(0, 10) + '...',
      env: process.env.NODE_ENV
    });

    if (!verificationData?.success) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Turnstile verification failed'
      }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Map translated standardized notes back to their original keys
    const standardizedNotes = reportData.standardizedNotes ?
      mapLabelsToKeys(reportData.standardizedNotes) :
      [];

    // --- Sanitize only the notes field ---
    const sanitize = (input: string | undefined) => {
      if (!input) return undefined;
      return input
        .replace(/[<>\\\"'&]/g, '') // Remove HTML special chars
        .replace(/javascript:/gi, '') // Remove javascript protocol
        .substring(0, 500) // Limit length
        .trim();
    };

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
          standardized_notes: standardizedNotes, // Use mapped keys
          notes: sanitize(reportData.notes), // Only sanitize the free-text notes
        },
      }],
    };

    // Log the payload being sent to Airtable for debugging
    console.log('Airtable payload:', airtableRecord);

    const response = await fetch(AIRTABLE_API_URL, {
      method: 'POST',
      headers: AIRTABLE_HEADERS,
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

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
    console.error('Submit error:', error);
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
