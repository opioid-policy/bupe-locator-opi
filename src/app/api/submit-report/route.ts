// src/app/api/submit-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo-data';

// --- Config ---
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// --- CORS Middleware ---
const allowedOrigins = process.env.NODE_ENV === 'development' 
  ? [/\.opioidpolicy\.org$/, 'http://localhost:3000']
  : [/\.opioidpolicy\.org$/];


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
    const reportData = await request.json();
    if (reportData.pharmacy?.zip_code && isDemoMode(reportData.pharmacy.zip_code)) {
      console.log('[DEBUG] Demo report submission detected - simulating success');
      
      // Simulate successful submission without hitting Airtable
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      return new NextResponse(JSON.stringify({
        success: true,
        recordId: `demo_record_${Date.now()}`,
        message: 'Demo report submitted successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

 
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
    const body = await request.json();
    const { turnstileToken, ...reportData } = body;

    // Check if this is a demo submission
    if (reportData.pharmacy?.zip_code && isDemoMode(reportData.pharmacy.zip_code)) {
      console.log('[DEBUG] Demo report submission detected - simulating success');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return new NextResponse(JSON.stringify({
        success: true,
        recordId: `demo_record_${Date.now()}`,
        message: 'Demo report submitted successfully'
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Rest of your existing validation and processing...
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
  const sanitize = (input: string | undefined) => {
  if (!input) return undefined;
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML special chars
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
