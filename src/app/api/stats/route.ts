import { table } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zip_code');
    
    // Get the date 7 days ago for weekly count
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const weeklyFilter = `IS_AFTER({submission_time}, "${sevenDaysAgoStr}")`;
    const zipFilter = zipCode ? `{zip_code} = "${zipCode}"` : '';
    
    // Get weekly count
    const weeklyRecords = await table.select({
      fields: ['submission_time'],
      filterByFormula: weeklyFilter,
    }).all();

    // Get total count - need to actually fetch all records to count them
    const allRecords = await table.select({
      fields: ['submission_time'],
      pageSize: 100, // Fetch in batches
    }).all();
    
    // Get ZIP code count if provided
    let zipCodeCount = 0;
    if (zipCode && zipFilter) {
      const zipRecords = await table.select({
        fields: ['zip_code'],
        filterByFormula: zipFilter,
      }).all();
      zipCodeCount = zipRecords.length;
    }

    const stats = {
      weeklyCount: weeklyRecords.length,
      totalCount: allRecords.length, // This gives actual total
      zipCodeCount: zipCodeCount || undefined,
    };

    // Return with cache headers
    return new NextResponse(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error("Error fetching stats from Airtable:", error);
    return NextResponse.json({ 
      weeklyCount: 0, 
      totalCount: 0,
      zipCodeCount: 0 
    }, { status: 500 });
  }
}