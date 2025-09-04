import { NextRequest, NextResponse } from 'next/server';

// Store analytics in Airtable
async function storeAnalytics(counts: Record<string, number>, stateCounts: Record<string, Record<string, number>>) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const ANALYTICS_TABLE_ID = process.env.AIRTABLE_ANALYTICS_TABLE_NAME; // Update with your actual table ID
  
const records = [];
  const date = new Date().toISOString().split('T')[0];
  
  // Global counts
  for (const [eventType, count] of Object.entries(counts)) {
    records.push({
      fields: {
        event_type: eventType,
        count: count,
        date: date,
        aggregation_level: 'national'
      }
    });
  }
  
  // State-level counts
  for (const [state, events] of Object.entries(stateCounts)) {
    for (const [eventType, count] of Object.entries(events)) {
      records.push({
        fields: {
          event_type: eventType,
          count: count,
          date: date,
          state: state,
          aggregation_level: 'state'
        }
      });
    }
  }
  
  // Batch create records in Airtable
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ANALYTICS_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records })
      }
    );
    
    if (!response.ok) {
      console.error('Airtable error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to store analytics:', error);
  }
}

function isValidUSState(state: string): boolean {
  const validStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];
  return validStates.includes(state);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events = [] } = body;
    
    // Aggregate counts
    const aggregatedCounts: Record<string, number> = {};
    const stateCounts: Record<string, Record<string, number>> = {};
    
    events.forEach((event: {event: string, state?: string}) => {
      // Validate allowed events
      const allowedEvents = [
        'find-pharmacy-click',
        'report-pharmacy-click', 
        'report-submitted',
        'language-switched'
      ];
      
      if (!allowedEvents.includes(event.event)) return;
      
      // Validate state if provided
      if (event.state && !isValidUSState(event.state)) return;
      
      // Count by event type
      aggregatedCounts[event.event] = (aggregatedCounts[event.event] || 0) + 1;
      
      // Count by state
      if (event.state) {
        if (!stateCounts[event.state]) stateCounts[event.state] = {};
        stateCounts[event.state][event.event] = (stateCounts[event.state][event.event] || 0) + 1;
      }
    });
    
    // Store in Airtable
    await storeAnalytics(aggregatedCounts, stateCounts);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}