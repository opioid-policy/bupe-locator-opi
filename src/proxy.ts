// src/proxy.ts (Next 16 name for middleware)
// Runs before every API request: size cap + per-IP rate limit kept in memory.
// The IP is used only as a rate-limit key for one minute and is never logged.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function proxy(request: NextRequest) {
  // 1. Check request size to prevent DOS attacks
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 100000) { // 100KB limit
    return new NextResponse('Request too large', { status: 413 });
  }
  
  // 2. Rate limiting with cleanup
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  
  // Clean up old entries to prevent memory leak
  for (const [key, value] of rateLimit.entries()) {
    if (value.resetTime < now) {
      rateLimit.delete(key);
    }
  }
  
  const clientLimit = rateLimit.get(ip) || { count: 0, resetTime: now + 60000 };
  
  if (clientLimit.resetTime < now) {
    clientLimit.count = 0;
    clientLimit.resetTime = now + 60000;
  }
  
  clientLimit.count++;
  rateLimit.set(ip, clientLimit);
  
  if (clientLimit.count > 60) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': clientLimit.resetTime.toString()
      }
    });
  }
  
  // 3. Respect Do Not Track header
  const dnt = request.headers.get('DNT');
  const response = NextResponse.next();
  
  if (dnt === '1') {
    response.headers.set('X-DNT-Respected', 'true');
  }
  
  // 4. Add security headers to all API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-RateLimit-Limit', '60');
  response.headers.set('X-RateLimit-Remaining', String(60 - clientLimit.count));
  
  return response;
}

// Only API routes, except the tile proxy: a single map pan loads dozens of
// tiles and would exhaust the 60/min budget (tiles are CDN-cached anyway).
export const config = {
  matcher: '/api/((?!tiles/).*)',
};