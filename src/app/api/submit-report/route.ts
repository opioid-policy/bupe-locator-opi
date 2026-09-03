// src/app/api/submit-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAntiSpam } from '@/lib/anti-spam';

// --- Config ---
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// --- CORS ---
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
    headers['Access-Control-Allow-Origin'] = origin;
    return headers;
  }

  if (origin.includes('opioidpolicy.org') || origin.includes('findbupe.org')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new NextResponse(JSON.stringify(body), { status, headers });
}

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
    return json({ success: false, error: 'Request too large' }, 413, corsHeaders);
  }

  try {
    const body = await request.json();
    // `website` (honeypot) and `_t` (form load time) replace the old Turnstile token.
    const { website, _t, standardizedNotes, ...reportData } = body;

    if (!reportData.pharmacy?.osm_id || !reportData.reportType) {
      return json({ success: false, error: 'Missing required fields' }, 400, corsHeaders);
    }

    if (!['success', 'denial'].includes(reportData.reportType)) {
      return json({ success: false, error: 'Invalid report type' }, 400, corsHeaders);
    }

    const spam = checkAntiSpam({ website, _t });
    if (!spam.ok) {
      return json({ success: false, error: spam.error }, spam.status, corsHeaders);
    }

    const notes = Array.isArray(standardizedNotes) ? standardizedNotes : [];

    // Sanitize only the free-text notes field
    const sanitize = (input: string | undefined) => {
      if (!input) return undefined;
      return input
        .replace(/[<>\\"'&]/g, '')
        .replace(/javascript:/gi, '')
        .substring(0, 500)
        .trim();
    };

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
          standardized_notes: notes,
          notes: sanitize(reportData.notes),
        },
      }],
    };

    // Never log the payload: it is the report itself.
    const response = await fetch(AIRTABLE_API_URL, {
      method: 'POST',
      headers: AIRTABLE_HEADERS,
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      console.error('Airtable submit failed with status', response.status);
      return json({ success: false, error: 'Failed to save report' }, 502, corsHeaders);
    }

    const result = await response.json();
    return json({ success: true, recordId: result.records[0]?.id }, 200, corsHeaders);

  } catch (error) {
    console.error('Submit error:', error instanceof Error ? error.message : 'unknown');
    return json({ success: false, error: 'Internal server error' }, 500, corsHeaders);
  }
}
