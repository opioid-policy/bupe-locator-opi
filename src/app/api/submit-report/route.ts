// src/app/api/submit-report/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken } = body;

  // --- Start Turnstile Verification ---
  if (!turnstileToken) {
    return NextResponse.json({ error: 'Turnstile token is missing.' }, { status: 400 });
  }

  const formData = new FormData();
  formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!);
  formData.append('response', turnstileToken);
  
  try {
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/api/turnstile/v2/siteverify', {
      method: 'POST',
      body: formData,
    });

    const turnstileData = await turnstileResponse.json();

    if (!turnstileData.success) {
      console.error('Turnstile verification failed:', turnstileData['error-codes']);
      return NextResponse.json({ error: 'Turnstile verification failed.', details: turnstileData['error-codes'] }, { status: 403 });
    }

    // If we get here, Turnstile verification was successful.
    return NextResponse.json({ success: true, message: "Turnstile check passed." });

  } catch (error) {
    console.error('An error occurred during Turnstile verification:', error);
    return NextResponse.json({ error: 'Failed to verify Turnstile token.' }, { status: 500 });
  }
  // --- End Turnstile Verification ---
}