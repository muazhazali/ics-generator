import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitStatus, getClientIP, SECURITY_HEADERS } from '@/lib/security'

// Simple admin authentication (in production, use proper authentication)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token || token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: SECURITY_HEADERS
        }
      )
    }

    // Get current request stats
    const currentIP = getClientIP(request)
    const currentStats = getRateLimitStatus(request)
    
    // In a production environment, you would query your database or Redis
    // For now, we'll return the current IP's stats as an example
    const stats = {
      currentIP: {
        ip: currentStats.ip,
        requests: currentStats.requests,
        aiRequests: currentStats.aiRequests,
        limits: currentStats.limits,
      },
      systemLimits: {
        perMinute: currentStats.limits.REQUESTS_PER_MINUTE,
        perHour: currentStats.limits.REQUESTS_PER_HOUR,
        perDay: currentStats.limits.REQUESTS_PER_DAY,
        aiPerHour: currentStats.limits.AI_REQUESTS_PER_HOUR,
        aiPerDay: currentStats.limits.AI_REQUESTS_PER_DAY,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(stats, {
      headers: SECURITY_HEADERS
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { 
        status: 500,
        headers: SECURITY_HEADERS
      }
    )
  }
}

// POST endpoint to reset rate limits for a specific IP (emergency use)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token || token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: SECURITY_HEADERS
        }
      )
    }

    const { action, ip } = await request.json()
    
    if (action === 'reset' && ip) {
      // In production, you would clear the rate limit data for the specific IP
      // For now, we'll just return a success message
      console.log(`Admin reset rate limits for IP: ${ip}`)
      
      return NextResponse.json(
        { message: `Rate limits reset for IP: ${ip}` },
        { headers: SECURITY_HEADERS }
      )
    }

    return NextResponse.json(
      { error: 'Invalid action or missing IP' },
      { 
        status: 400,
        headers: SECURITY_HEADERS
      }
    )
  } catch (error) {
    console.error('Error in admin action:', error)
    return NextResponse.json(
      { error: 'Failed to process admin action' },
      { 
        status: 500,
        headers: SECURITY_HEADERS
      }
    )
  }
} 