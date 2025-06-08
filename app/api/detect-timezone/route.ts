import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit, 
  recordRequest, 
  checkSuspiciousRequest,
  getClientIP,
  SECURITY_HEADERS 
} from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    // Basic rate limiting for GET requests
    const rateLimitCheck = checkRateLimit(request, false)
    if (!rateLimitCheck.allowed) {
      recordRequest(request, '/api/detect-timezone', false, false)
      return NextResponse.json(
        { 
          error: rateLimitCheck.reason,
          retryAfter: rateLimitCheck.retryAfter 
        },
        { 
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
          }
        }
      )
    }

    recordRequest(request, '/api/detect-timezone', true, false)
    
    // This endpoint will be called from the client-side to get the user's timezone
    // The actual timezone detection happens on the client side using Intl.DateTimeFormat
    return NextResponse.json({ 
      message: 'Timezone detection should be done client-side using Intl.DateTimeFormat().resolvedOptions().timeZone' 
    }, {
      headers: SECURITY_HEADERS
    })
  } catch (error) {
    console.error('Error in timezone detection endpoint:', error)
    recordRequest(request, '/api/detect-timezone', false, false)
    return NextResponse.json(
      { error: 'Failed to process timezone detection' },
      { 
        status: 500,
        headers: SECURITY_HEADERS
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const rateLimitCheck = checkRateLimit(request, false)
    if (!rateLimitCheck.allowed) {
      recordRequest(request, '/api/detect-timezone', false, false)
      return NextResponse.json(
        { 
          error: rateLimitCheck.reason,
          retryAfter: rateLimitCheck.retryAfter 
        },
        { 
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
          }
        }
      )
    }

    // Check for suspicious requests
    const suspiciousCheck = checkSuspiciousRequest(request)
    if (suspiciousCheck.suspicious) {
      console.warn(`Suspicious request from ${getClientIP(request)}: ${suspiciousCheck.reason}`)
      recordRequest(request, '/api/detect-timezone', false, false)
      return NextResponse.json(
        { error: 'Request blocked for security reasons' },
        { 
          status: 403,
          headers: SECURITY_HEADERS
        }
      )
    }

    const { timezone } = await request.json()
    
    if (!timezone) {
      recordRequest(request, '/api/detect-timezone', false, false)
      return NextResponse.json(
        { error: 'Timezone is required' },
        { 
          status: 400,
          headers: SECURITY_HEADERS
        }
      )
    }

    // Validate timezone string length and format
    if (typeof timezone !== 'string' || timezone.length > 50) {
      recordRequest(request, '/api/detect-timezone', false, false)
      return NextResponse.json(
        { error: 'Invalid timezone format' },
        { 
          status: 400,
          headers: SECURITY_HEADERS
        }
      )
    }

    // Validate that the timezone is a valid IANA timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch (error) {
      recordRequest(request, '/api/detect-timezone', false, false)
      return NextResponse.json(
        { error: 'Invalid timezone format' },
        { 
          status: 400,
          headers: SECURITY_HEADERS
        }
      )
    }

    recordRequest(request, '/api/detect-timezone', true, false)
    
    // Return the validated timezone
    return NextResponse.json({ timezone }, {
      headers: SECURITY_HEADERS
    })
  } catch (error) {
    console.error('Error validating timezone:', error)
    recordRequest(request, '/api/detect-timezone', false, false)
    return NextResponse.json(
      { error: 'Failed to validate timezone' },
      { 
        status: 500,
        headers: SECURITY_HEADERS
      }
    )
  }
} 