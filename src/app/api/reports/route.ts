import { NextResponse } from 'next/server';
import Airtable, { FieldSet } from 'airtable';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize Airtable with your environment variables
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || '',
});

const base = airtable.base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || '');
const tableName = process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME || 'Reports';

// Define types for Airtable records - extends FieldSet to satisfy Airtable constraints
interface AirtableRecordFields extends FieldSet {
  report_type: 'success' | 'denial';
  formulation?: string[];
  standardized_notes?: string[];
  zip_code?: string;
  state?: string;
  submission_time: string;
}

interface CleanReport {
  reportType: 'success' | 'denial';
  formulations: string[];
  standardizedNotes: string[];
  zipCode: string;
  state: string;
  submissionTime: string;
}

interface CachedData {
  data: CleanReport[];
  lastUpdate: string;
  lastUpdateMonth: string;
  timeframe: string;
}

// Cache file paths
const getCacheFilePath = (timeframe: string) => {
  return path.join('/tmp', `dashboard-cache-${timeframe}.json`);
};

// Helper function to get current month key
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper function to get date ranges
function getDateRanges() {
  const now = new Date();
  
  // Current month (for current month data)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Previous month (for "last month" data)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  return {
    currentMonthStart: currentMonthStart.toISOString().split('T')[0],
    previousMonthStart: previousMonthStart.toISOString().split('T')[0],
    previousMonthEnd: previousMonthEnd.toISOString().split('T')[0]
  };
}

// Function to read cached data
async function readCache(timeframe: string): Promise<CachedData | null> {
  try {
    const cacheFile = getCacheFilePath(timeframe);
    const data = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Cache doesn't exist or is invalid
    return null;
  }
}

// Function to write cached data
async function writeCache(timeframe: string, data: CleanReport[]): Promise<void> {
  try {
    const cacheFile = getCacheFilePath(timeframe);
    const cacheData: CachedData = {
      data,
      lastUpdate: new Date().toISOString(),
      lastUpdateMonth: getCurrentMonthKey(),
      timeframe
    };
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
  } catch {
    console.error('Error writing cache - proceeding without cache');
    // Don't throw - we can still return data even if caching fails
  }
}

// Function to check if cache is valid for the current month
function isCacheValid(cachedData: CachedData | null, timeframe: string): boolean {
  if (!cachedData) return false;
  
  const currentMonth = getCurrentMonthKey();
  
  // For 'all' timeframe, refresh monthly
  if (timeframe === 'all') {
    return cachedData.lastUpdateMonth === currentMonth;
  }
  
  // For 'previous-month', only refresh when we move to a new month
  // (previous month data becomes stable)
  if (timeframe === 'previous-month') {
    return cachedData.lastUpdateMonth === currentMonth;
  }
  
  // For 'current-month', refresh monthly (since it's always changing)
  if (timeframe === 'current-month') {
    return cachedData.lastUpdateMonth === currentMonth;
  }
  
  return false;
}

// Function to fetch fresh data from Airtable
async function fetchFromAirtable(timeframe: string): Promise<CleanReport[]> {
  // Validate environment variables
  if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
    throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not configured');
  }
  if (!process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID) {
    throw new Error('NEXT_PUBLIC_AIRTABLE_BASE_ID is not configured');
  }

  // Build filter formula based on timeframe
  let filterFormula = '';
  const { currentMonthStart, previousMonthStart, previousMonthEnd } = getDateRanges();
  
  if (timeframe === 'current-month') {
    // Data from start of current month to now
    filterFormula = `IS_AFTER({submission_time}, "${currentMonthStart}")`;
  } else if (timeframe === 'previous-month') {
    // Data from previous month only (completed month)
    filterFormula = `AND(IS_AFTER({submission_time}, "${previousMonthStart}"), IS_BEFORE({submission_time}, "${previousMonthEnd}"))`;
  }
  // No filter for 'all' - returns all records

  console.log(`Fetching fresh data from Airtable for timeframe: ${timeframe}`);

  // Fetch records from Airtable
  const records: CleanReport[] = await new Promise<CleanReport[]>((resolve, reject) => {
    const allRecords: CleanReport[] = [];
    
    base(tableName)
      .select({
        filterByFormula: filterFormula,
        view: 'Grid view',
        // No maxRecords limit - get all data
      })
      .eachPage(
        (records, fetchNextPage) => {
          // Process each page of records
          records.forEach((record) => {
            const fields = record.fields as AirtableRecordFields;
            
            // Validate required fields
            if (!fields.report_type || !fields.submission_time) {
              console.warn('Skipping record with missing required fields:', record.id);
              return;
            }

            allRecords.push({
              reportType: fields.report_type,
              formulations: fields.formulation || [],
              standardizedNotes: fields.standardized_notes || [],
              zipCode: fields.zip_code || '',
              state: fields.state || '',
              submissionTime: fields.submission_time,
            });
          });
          
          // Fetch the next page
          fetchNextPage();
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`Fetched ${allRecords.length} records for timeframe: ${timeframe}`);
            resolve(allRecords);
          }
        }
      );
  });

  return records;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'all';

  try {
    // Try to read from cache first
    const cachedData = await readCache(timeframe);
    
    // Check if cache is valid for current month
    if (isCacheValid(cachedData, timeframe)) {
      console.log(`Serving cached data for timeframe: ${timeframe}`);
      return NextResponse.json({
        data: cachedData!.data,
        count: cachedData!.data.length,
        timeframe,
        generatedAt: cachedData!.lastUpdate,
        source: 'cache'
      });
    }

    // Cache is invalid or doesn't exist, fetch fresh data
    const freshData = await fetchFromAirtable(timeframe);
    
    // Cache the fresh data
    await writeCache(timeframe, freshData);

    const response = NextResponse.json({
      data: freshData,
      count: freshData.length,
      timeframe,
      generatedAt: new Date().toISOString(),
      source: 'fresh'
    });

    // Set cache headers for browser caching (1 day since we handle monthly refresh server-side)
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');

    return response;

  } catch (error) {
    console.error('Error fetching reports:', error);
    
    // If we have cached data, serve it even if fresh fetch failed
    const cachedData = await readCache(timeframe);
    if (cachedData) {
      console.log(`Serving stale cached data due to error for timeframe: ${timeframe}`);
      return NextResponse.json({
        data: cachedData.data,
        count: cachedData.data.length,
        timeframe,
        generatedAt: cachedData.lastUpdate,
        source: 'stale-cache',
        warning: 'Using cached data due to fetch error'
      });
    }
    
    // Return error if no cache available
    if (error instanceof Error) {
      if (error.message.includes('AIRTABLE')) {
        return NextResponse.json(
          { error: 'Airtable configuration error', details: error.message },
          { status: 500 }
        );
      }
      if (error.message.includes('AUTHENTICATION_REQUIRED')) {
        return NextResponse.json(
          { error: 'Invalid Airtable credentials' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reports from Airtable' },
      { status: 500 }
    );
  }
}