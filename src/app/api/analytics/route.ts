// src/app/api/analytics/route.ts - Completely IP-free
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { events, timestamp } = await request.json();
    
    // Basic temporal validation (prevent very old/future requests)
    const now = Date.now();
    const requestAge = Math.abs(now - timestamp);
    if (requestAge > 300000) { // Reject requests older than 5 minutes
      return NextResponse.json({ error: 'Request too old' }, { status: 400 });
    }
    
    // Validate event structure and types
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Invalid events' }, { status: 400 });
    }
    
    // Process events into aggregate counts
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
      
      // Validate state if provided (prevent injection)
      if (event.state && !isValidUSState(event.state)) return;
      
      // Count by event type
      aggregatedCounts[event.event] = (aggregatedCounts[event.event] || 0) + 1;
      
      // Count by state
      if (event.state) {
        if (!stateCounts[event.state]) stateCounts[event.state] = {};
        stateCounts[event.state][event.event] = (stateCounts[event.state][event.event] || 0) + 1;
      }
    });
    
    // Store in your existing Airtable analytics table
    await storeAnalytics(aggregatedCounts, stateCounts);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
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

async function storeAnalytics(counts: Record<string, number>, stateCounts: Record<string, Record<string, number>>) {
  // Store in your existing Airtable structure
  // This would update your State Level Reports table with the new click data
  
  const records = [];
  
  // Global counts
  for (const [eventType, count] of Object.entries(counts)) {
    records.push({
      fields: {
        event_type: eventType,
        count: count,
        date: new Date().toISOString().split('T')[0],
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
          date: new Date().toISOString().split('T')[0],
          state: state,
          aggregation_level: 'state'
        }
      });
    }
  }
  
  // Batch update your Airtable analytics table
  await updateAirtableAnalytics(records);
}