import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/security'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Apply security measures to API routes
  if (pathname.startsWith('/api/')) {
    // Check for required headers
    const contentType = request.headers.get('content-type')
    const userAgent = request.headers.get('user-agent')
    
    // Block requests without proper content type for POST requests
    if (request.method === 'POST' && !contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { 
          status: 400,
          headers: SECURITY_HEADERS
        }
      )
    }

    // Block requests without user agent (likely bots)
    if (!userAgent) {
      return NextResponse.json(
        { error: 'User-Agent header is required' },
        { 
          status: 400,
          headers: SECURITY_HEADERS
        }
      )
    }

    // CORS handling for API routes
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com' // Replace with your actual domain
            : '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Add CORS headers to API responses
    const response = NextResponse.next()
    
    // Set CORS headers
    response.headers.set(
      'Access-Control-Allow-Origin', 
      process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' // Replace with your actual domain
        : '*'
    )
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent')
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next()
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 