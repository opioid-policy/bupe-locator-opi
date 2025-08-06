// src/app/api/stats/route.ts

import { table } from '@/lib/airtable';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zip_code');

  try {
    let totalCount = 0;
    let weeklyCount = 0;
    let zipCodeCount = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // This is an efficient way to get all records and then filter them in memory
    const allRecords = await table.select({
      // Ensure we fetch the correct fields from Airtable
      fields: ['zip_code', 'submission_time']
    }).all();

    totalCount = allRecords.length;

    for (const record of allRecords) {
      // Calculate weekly count using your 'submission_time' field
      if (new Date(record.get('submission_time') as string) > new Date(sevenDaysAgo)) {
        weeklyCount++;
      }
      // Calculate zip code count if a zip code was provided
      if (zipCode && record.get('zip_code') === zipCode) {
        zipCodeCount++;
      }
    }

    return NextResponse.json({ totalCount, weeklyCount, zipCodeCount });

  } catch (error) {
    console.error("Detailed error fetching stats from Airtable:", error);
    return NextResponse.json({ totalCount: 0, weeklyCount: 0, zipCodeCount: 0 });
  }
}