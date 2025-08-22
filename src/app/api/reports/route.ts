// src/app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { airtableAPI } from '@/lib/airtable-api';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Constants for timeframes - only the ones we want to support
const TIMEFRAMES = {
  ALL: 'all',
  PAST_MONTH: 'past-month'
} as const;

type Timeframe = typeof TIMEFRAMES[keyof typeof TIMEFRAMES];

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
  timeframe: Timeframe;
}

// Cache directory configuration
const CACHE_DIR = path.join(process.cwd(), '.cache', 'dashboard');
const MAX_CACHE_FILES = 3;

// Helper functions remain the same
const getCacheFilePath = (timeframe: Timeframe) => path.join(CACHE_DIR, `dashboard-cache-${timeframe}.json`);

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDateRanges() {
  const now = new Date();
  const pastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  return {
    pastMonthStart: pastMonthStart.toISOString().split('T')[0],
    pastMonthEnd: pastMonthEnd.toISOString().split('T')[0]
  };
}

// Cache functions remain the same
async function readCache(timeframe: Timeframe): Promise<CachedData | null> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cacheFile = getCacheFilePath(timeframe);
    const data = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeCache(timeframe: Timeframe, data: CleanReport[]): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cacheFile = getCacheFilePath(timeframe);
    const cacheData: CachedData = {
      data,
      lastUpdate: new Date().toISOString(),
      lastUpdateMonth: getCurrentMonthKey(),
      timeframe
    };
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    await cleanupOldCacheFiles();
  } catch {
    console.error('Error writing cache - proceeding without cache');
  }
}

async function cleanupOldCacheFiles() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(f => f.startsWith('dashboard-cache-'));

    if (cacheFiles.length > MAX_CACHE_FILES) {
      const filesWithStats = await Promise.all(
        cacheFiles.map(async (file) => {
          const filePath = path.join(CACHE_DIR, file);
          const stat = await fs.stat(filePath);
          return { file, mtimeMs: stat.mtimeMs };
        })
      );

      filesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);

      for (const { file } of filesWithStats.slice(MAX_CACHE_FILES)) {
        await fs.unlink(path.join(CACHE_DIR, file));
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

function isCacheValid(cachedData: CachedData | null): boolean {
  if (!cachedData) return false;
  const currentMonth = getCurrentMonthKey();
  return cachedData.lastUpdateMonth === currentMonth;
}

async function fetchFromAirtable(timeframe: Timeframe): Promise<CleanReport[]> {
  // Use your actual environment variable names
  if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
    throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not configured');
  }
  if (!process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID) {
    throw new Error('NEXT_PUBLIC_AIRTABLE_BASE_ID is not configured');
  }

  let filterFormula = '';
  const { pastMonthStart, pastMonthEnd } = getDateRanges();

  if (timeframe === TIMEFRAMES.PAST_MONTH) {
    filterFormula = `AND(
      IS_AFTER({submission_time}, "${pastMonthStart}"),
      IS_BEFORE({submission_time}, "${pastMonthEnd}")
    )`;
  }

  console.log(`Fetching fresh data from Airtable for timeframe: ${timeframe}`);

  let offset: string | undefined;
  const allRecords: CleanReport[] = [];
  let pageCount = 0;
  const MAX_PAGES = 20;

  do {
    pageCount++;
    const records = await airtableAPI.select({
      filterByFormula: filterFormula,
      view: 'Grid view',
      pageSize: 100,
      ...(offset ? { offset } : {})
    });

    const airtableRecords = records as { offset?: string } & typeof records;

    for (const record of records) {
      const fields = record.fields;

      if (!fields.report_type || !fields.submission_time) {
        console.warn('Skipping record with missing required fields:', record.id);
        continue;
      }

      allRecords.push({
        reportType: fields.report_type as 'success' | 'denial',
        formulations: Array.isArray(fields.formulation) ? fields.formulation : [],
        standardizedNotes: Array.isArray(fields.standardized_notes) ? fields.standardized_notes : [],
        zipCode: typeof fields.zip_code === 'string' ? fields.zip_code.substring(0, 3) + '..' : '',
        state: typeof fields.state === 'string' ? fields.state : '',
        submissionTime: typeof fields.submission_time === 'string' ? fields.submission_time : ''
      });
    }

    offset = airtableRecords.offset;
  } while (offset && pageCount < MAX_PAGES);

  console.log(`Fetched ${allRecords.length} records for timeframe: ${timeframe}`);
  return allRecords;
}

function generateETag(data: CleanReport[]): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data.length));
  return hash.digest('base64');
}

export async function GET(request: Request) {
  // Basic rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimit = new Map<string, { count: number, lastRequest: number }>();

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 0, lastRequest: Date.now() });
  }

  const client = rateLimit.get(ip)!;
  const timeSinceLast = Date.now() - client.lastRequest;

  if (timeSinceLast < 1000) {
    client.count++;
    if (client.count > 10) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  } else {
    client.count = 1;
    client.lastRequest = Date.now();
  }

  const { searchParams } = new URL(request.url);
  const timeframeParam = searchParams.get('timeframe') || TIMEFRAMES.ALL;

  // Validate timeframe - only accept our defined values
  if (!Object.values(TIMEFRAMES).includes(timeframeParam as Timeframe)) {
    return NextResponse.json(
      { error: `Invalid timeframe. Must be one of: ${Object.values(TIMEFRAMES).join(', ')}` },
      { status: 400 }
    );
  }

  const timeframe = timeframeParam as Timeframe;

  try {
    const cachedData = await readCache(timeframe);

    if (isCacheValid(cachedData)) {
      console.log(`Serving cached data for timeframe: ${timeframe}`);
      const etag = generateETag(cachedData!.data);
      const ifNoneMatch = request.headers.get('if-none-match');

      if (ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
            'ETag': etag
          }
        });
      }

      return NextResponse.json({
        data: cachedData!.data,
        count: cachedData!.data.length,
        timeframe,
        generatedAt: cachedData!.lastUpdate,
        source: 'cache'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'ETag': etag
        }
      });
    }

    const freshData = await fetchFromAirtable(timeframe);
    await writeCache(timeframe, freshData);
    const etag = generateETag(freshData);

    const response = NextResponse.json({
      data: freshData,
      count: freshData.length,
      timeframe,
      generatedAt: new Date().toISOString(),
      source: 'fresh'
    });

    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    response.headers.set('ETag', etag);

    return response;

  } catch (error) {
    console.error('Error fetching reports:', error instanceof Error ? error.message : 'Unknown error');

    const cachedData = await readCache(timeframe);
    if (cachedData) {
      console.log(`Serving stale cached data due to error for timeframe: ${timeframe}`);
      const etag = generateETag(cachedData.data);
      return NextResponse.json({
        data: cachedData.data,
        count: cachedData.data.length,
        timeframe,
        generatedAt: cachedData.lastUpdate,
        source: 'stale-cache',
        warning: 'Using cached data due to fetch error'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'ETag': etag
        }
      });
    }

    if (error instanceof Error) {
      if (error.message.includes('AIRTABLE')) {
        return NextResponse.json(
          { error: 'Airtable configuration error' },
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
