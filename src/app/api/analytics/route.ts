import { NextRequest, NextResponse } from 'next/server';

async function storeAnalytics(events: Array<{event: string, state?: string}>) {
  const AIRTABLE_PERSONAL_ACCESS_TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_ANALYTICS_TABLE_NAME = process.env.AIRTABLE_ANALYTICS_TABLE_ID;
  
  // Get today's date for aggregation
  const today = new Date().toISOString().split('T')[0];
  
  // First, fetch existing records for today to update counts
  try {
    const filterFormula = `DATESTR({created_at}) = "${today}"`;
    const fetchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_ANALYTICS_TABLE_NAME}?filterByFormula=${encodeURIComponent(filterFormula)}`;
    
    const existingResponse = await fetch(fetchUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
      }
    });
    
    const existingData = await existingResponse.json();
    const existingRecords = existingData.records || [];
    
    // Create aggregation maps
    const nationalCounts: Record<string, number> = {};
    const stateCounts: Record<string, Record<string, number>> = {};
    
    // Count new events
    events.forEach(event => {
      // National aggregation
      nationalCounts[event.event] = (nationalCounts[event.event] || 0) + 1;
      
      // State aggregation
      if (event.state) {
        if (!stateCounts[event.state]) {
          stateCounts[event.state] = {};
        }
        stateCounts[event.state][event.event] = 
          (stateCounts[event.state][event.event] || 0) + 1;
      }
    });
    
    // Update existing records or create new ones
    const updates: any[] = [];
    const creates: any[] = [];
    
    // Process national counts
    for (const [eventType, count] of Object.entries(nationalCounts)) {
    const existing = existingRecords.find((r: { fields: { event_type: string; aggregation_level: string } }) =>        
      r.fields.event_type === eventType && 
      r.fields.aggregation_level === 'national'
      );
      
      if (existing) {
        updates.push({
          id: existing.id,
          fields: {
            count: (existing.fields.count || 0) + count
          }
        });
      } else {
        creates.push({
          fields: {
            event_type: eventType,
            count: count,
            aggregation_level: 'national'
          }
        });
      }
    }
    
    // Process state counts
    for (const [state, eventCounts] of Object.entries(stateCounts)) {
      for (const [eventType, count] of Object.entries(eventCounts)) {
        const existing = existingRecords.find((r: any) => 
          r.fields.event_type === eventType && 
          r.fields.state === state &&
          r.fields.aggregation_level === 'state'
        );
        
        if (existing) {
          updates.push({
            id: existing.id,
            fields: {
              count: (existing.fields.count || 0) + count
            }
          });
        } else {
          creates.push({
            fields: {
              event_type: eventType,
              count: count,
              state: state,
              aggregation_level: 'state'
            }
          });
        }
      }
    }
    
    // Execute updates
    if (updates.length > 0) {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_ANALYTICS_TABLE_NAME}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ records: updates })
        }
      );
    }
    
    // Execute creates
    if (creates.length > 0) {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_ANALYTICS_TABLE_NAME}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ records: creates })
        }
      );
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
    // No IP logging, no user agent, no fingerprinting
    const body = await request.json();
    const { events = [], timestamp } = body;
    
    // Basic rate limiting: reject if too many events at once
    if (events.length > 50) {
      return NextResponse.json({ error: 'Too many events' }, { status: 429 });
    }
    
    // Basic temporal validation (not for tracking, just anti-spam)
    if (timestamp && Math.abs(Date.now() - timestamp) > 60000) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Filter and validate events
const validEvents = events.filter((event: { event: string; state?: string }) => {
        const allowedEvents = [
        'find-pharmacy-click',
        'report-pharmacy-click',
        'report-submitted',
        'language-switched'
      ];
      
      if (!allowedEvents.includes(event.event)) return false;
      if (event.state && !isValidUSState(event.state)) return false;
      
      return true;
    });
    
    if (validEvents.length > 0) {
      await storeAnalytics(validEvents);
    }
    
    // Always return success (don't reveal validation details)
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Analytics error:', error);
    // Generic error response (no details)
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}