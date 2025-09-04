import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use your env variable names
    const AIRTABLE_PERSONAL_ACCESS_TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_ANALYTICS_TABLE_NAME = process.env.AIRTABLE_ANALYTICS_TABLE_NAME;
    
    if (!AIRTABLE_PERSONAL_ACCESS_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_ANALYTICS_TABLE_NAME) {
      console.error('Missing Airtable configuration for dashboard');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_ANALYTICS_TABLE_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dashboard analytics fetch error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
    
    const data = await response.json();
    
    // Process analytics data for past month and all time
    const byState: Record<string, any> = {};
    const totals: Record<string, number> = {
      'find-pharmacy-click': 0,
      'report-pharmacy-click': 0,
      'report-submitted': 0,
      'language-switched': 0
    };
    
    // Get date 30 days ago for "past month" filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    data.records?.forEach((record: any) => {
      const eventType = record.fields.event_type;
      const count = record.fields.count || 0;
      const state = record.fields.state;
      const createdAt = new Date(record.createdTime);
      
      if (state) {
        if (!byState[state]) {
          byState[state] = {
            'find-pharmacy-click': 0,
            'report-pharmacy-click': 0,
            'report-submitted': 0,
            'language-switched': 0
          };
        }
        byState[state][eventType] = (byState[state][eventType] || 0) + count;
      }
      
      totals[eventType] = (totals[eventType] || 0) + count;
    });
    
    return NextResponse.json({ byState, totals });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}