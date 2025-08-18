// src/app/api/submit-report/route.ts - COMPLETE FILE WITH DNT
import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput, sanitizePharmacyData } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // Check for Do Not Track header (set by middleware)
  const respectDNT = request.headers.get('X-DNT-Respected') === 'true';
  
  const body = await request.json();
  const { turnstileToken, ...reportData } = body;

  // --- Start Turnstile Verification ---
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

    // Sanitize the pharmacy data to prevent XSS
    const sanitizedPharmacy = sanitizePharmacyData(reportData.pharmacy);
    const sanitizedNotes = sanitizeInput(reportData.notes || '');
    
    // Get the ID from either field (OSM or manual)
    const pharmacyId = reportData.pharmacy.mapbox_id || reportData.pharmacy.id || '';
    
    // If DNT is enabled, minimize data collection
    const fieldsToSave = {
      pharmacy_id: pharmacyId,
      pharmacy_name: sanitizedPharmacy.name,
      street_address: sanitizedPharmacy.street_address,
      city: sanitizedPharmacy.city,
      state: sanitizedPharmacy.state,
      zip_code: sanitizedPharmacy.zip_code,
      latitude: reportData.pharmacy.latitude,
      longitude: reportData.pharmacy.longitude,
      phone_number: sanitizedPharmacy.phone_number,
      report_type: reportData.reportType,
      formulation: reportData.formulations,
      standardized_notes: reportData.standardizedNotes,
      // Don't save free text notes if DNT is enabled (extra privacy)
      notes: respectDNT ? '' : sanitizedNotes,
    };
    
    // Log less if DNT is enabled
    if (!respectDNT) {
      console.log('Report submitted for pharmacy:', pharmacyId);
    }

    await table.create([{ fields: fieldsToSave }]);
    
    // Include DNT status in response
    const response = NextResponse.json({ 
      success: true,
      privacy_mode: respectDNT ? 'enhanced' : 'standard'
    }, { status: 200 });
    
    // Add header to confirm DNT was respected
    if (respectDNT) {
      response.headers.set('X-DNT-Status', 'Respected');
    }
    
    return response;

  } catch (error) {
    // Only log errors if DNT is not enabled
    if (!respectDNT) {
      console.error('Error saving to Airtable:', error);
    }
    return NextResponse.json({ error: 'Failed to save report.' }, { status: 500 });
  }
}