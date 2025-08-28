// Create this file at: src/middleware.ts (NOT in app folder)
// This runs before every request to your API routes

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
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
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-RateLimit-Limit', '60');
  response.headers.set('X-RateLimit-Remaining', String(60 - clientLimit.count));
  
  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};