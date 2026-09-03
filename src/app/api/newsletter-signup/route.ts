// src/app/api/newsletter-signup/route.ts
// Receives the shared OPI footer's newsletter form (FormData: email, the
// `website` honeypot, and the `_t` load timestamp) and stores the address in
// Airtable. Also accepts JSON with the same fields. No Turnstile, no IP logging.
import { NextRequest, NextResponse } from 'next/server';
import { checkAntiSpam } from '@/lib/anti-spam';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_NEWSLETTER_TABLE_NAME || 'Newsletter_Signups'}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const defaultHeaders = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (!origin) return defaultHeaders;

  const allowedOrigins = process.env.NODE_ENV === 'development'
    ? [/\.opioidpolicy\.org$/, 'http://localhost:3000']
    : [/\.opioidpolicy\.org$/];

  const isAllowed = allowedOrigins.some(allowedOrigin =>
    typeof allowedOrigin === 'string'
      ? origin === allowedOrigin
      : allowedOrigin.test(origin)
  );

  return isAllowed ? { ...defaultHeaders, 'Access-Control-Allow-Origin': origin } : defaultHeaders;
}

const sanitize = (input: string | undefined) => {
  if (!input) return undefined;
  return input
    .replace(/[<>"'&]/g, '')
    .replace(/javascript:/gi, '')
    .substring(0, 320)
    .trim();
};

const asString = (v: unknown) => (typeof v === 'string' ? v : undefined);

async function readFields(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    return {
      email: asString(body.email),
      website: asString(body.website),
      _t: body._t as unknown,
    };
  }
  const form = await request.formData();
  return {
    email: asString(form.get('email')),
    website: asString(form.get('website')),
    _t: form.get('_t') as unknown,
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10240) {
    return NextResponse.json({ success: false, error: 'Request too large' }, { status: 413, headers: corsHeaders });
  }

  try {
    const { email, website, _t } = await readFields(request);

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required.' }, { status: 400, headers: corsHeaders });
    }

    const spam = checkAntiSpam({ website, _t });
    if (!spam.ok) {
      return NextResponse.json({ success: false, error: spam.error }, { status: spam.status, headers: corsHeaders });
    }

    const sanitizedEmail = sanitize(email.toLowerCase());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sanitizedEmail || !emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400, headers: corsHeaders });
    }

    const airtableRecord = {
      records: [{
        fields: {
          email: sanitizedEmail,
          consent: true, // submitting the form is the consent action
          source: 'bupe-locator',
          status: 'pending',
        },
      }],
    };

    const response = await fetch(AIRTABLE_API_URL, {
      method: 'POST',
      headers: AIRTABLE_HEADERS,
      body: JSON.stringify(airtableRecord),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 422 && errorData.error?.message?.includes('already exists')) {
        return NextResponse.json({ success: true, message: "You're already subscribed! Thank you." }, { headers: corsHeaders });
      }
      console.error('Newsletter Airtable error status', response.status);
      return NextResponse.json({ success: false, error: 'Failed to subscribe. Please try again later.' }, { status: 502, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed!' }, { headers: corsHeaders });

  } catch (error) {
    console.error('Newsletter signup error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'An unexpected error occurred. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
