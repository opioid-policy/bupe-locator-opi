// Create this file at: src/middleware.ts (NOT in app folder)
// This runs before every request to your API routes

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Check request size to prevent DOS attacks
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 100000) { // 100KB limit
    return new NextResponse('Request too large', { status: 413 });
  }
  
  // 2. Respect Do Not Track header
  const dnt = request.headers.get('DNT');
  const response = NextResponse.next();
  
  if (dnt === '1') {
    // User has Do Not Track enabled - add header to response
    response.headers.set('X-DNT-Respected', 'true');
    // You can check for this header in your API routes to provide extra privacy
  }
  
  // 3. Add security headers to all API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 4. Rate limiting info (actual limiting is in API routes)
  response.headers.set('X-RateLimit-Limit', '60');
  
  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};