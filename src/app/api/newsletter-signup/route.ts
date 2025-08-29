// src/app/api/newsletter-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Use your existing Airtable configuration
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_NEWSLETTER_TABLE_NAME || 'Newsletter_Signups'}`;
const AIRTABLE_HEADERS = {
  'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// Use same CORS setup as your existing API
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

  return isAllowed
    ? {
        ...defaultHeaders,
        'Access-Control-Allow-Origin': origin,
      }
    : defaultHeaders;
}

// Sanitize function (same as your existing API)
const sanitize = (input: string | undefined) => {
  if (!input) return undefined;
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML special chars
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .substring(0, 320) // Email max length per RFC 5321
    .trim();
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // Same request size limit as your existing API
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10240) { // 10KB limit
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Request too large'
    }), {
      status: 413,
      headers: corsHeaders,
    });
  }

  try {
    const { email, turnstileToken, consent } = await request.json();

    // Basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: 'Consent is required to subscribe.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Turnstile Verification (same as your existing API) ---
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

    // Sanitize and validate email
    const sanitizedEmail = sanitize(email.toLowerCase());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!sanitizedEmail || !emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Airtable Submission (same pattern as your existing API) ---
    const airtableRecord = {
      records: [{
        fields: {
          email: sanitizedEmail,
          consent: consent,
          source: 'bupe-locator',
          status: 'pending', // You can batch process these later
          // Add any other fields you want to track
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
      
      // Handle duplicate email (if you have a unique email field)
      if (response.status === 422 && 
          errorData.error?.message?.includes('already exists')) {
        return NextResponse.json({
          success: true,
          message: 'You\'re already subscribed! Thank you.'
        }, { headers: corsHeaders });
      }

      console.error('Airtable error:', errorData);
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: response.status, headers: corsHeaders }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! You\'ll receive updates on organizing and policy changes.',
      recordId: result.records[0]?.id,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}