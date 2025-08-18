import { table } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the date 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Filter for reports from the last 7 days
    const filterFormula = `IS_AFTER({submission_time}, "${sevenDaysAgoStr}")`;

    const records = await table.select({
      fields: ['submission_time'],
      filterByFormula: filterFormula,
    }).all();

    const weeklyCount = records.length;

    // Return with cache headers
    return new NextResponse(JSON.stringify({ weeklyCount }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour since stats don't change often
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error("Error fetching stats from Airtable:", error);
    return NextResponse.json({ weeklyCount: 0 }, { status: 500 });
  }
}
