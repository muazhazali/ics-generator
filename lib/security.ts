import { NextRequest } from 'next/server'

// Rate limiting configuration
const RATE_LIMITS = {
  // Per IP address limits
  PER_IP: {
    REQUESTS_PER_MINUTE: 10,
    REQUESTS_PER_HOUR: 50,
    REQUESTS_PER_DAY: 200,
    AI_REQUESTS_PER_HOUR: 20,
    AI_REQUESTS_PER_DAY: 100,
  },
  // Content size limits
  CONTENT: {
    MAX_TEXT_LENGTH: 50000, // 50KB of text
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_PROCESSING_TIME: 30000, // 30 seconds
  },
  // Suspicious behavior thresholds
  ABUSE_DETECTION: {
    RAPID_REQUESTS_THRESHOLD: 5, // requests in 10 seconds
    REPEATED_FAILURES_THRESHOLD: 10, // failed requests per hour
    SUSPICIOUS_CONTENT_PATTERNS: [
      /(.{1000,})\1{5,}/, // Repeated content patterns
      /[^\x00-\x7F]{1000,}/, // Large non-ASCII content
      /<script|javascript:|data:|vbscript:/i, // Potential XSS
    ],
  },
}

// In-memory storage for rate limiting (use Redis in production)
const requestStore = new Map<string, {
  requests: { timestamp: number; endpoint: string; success: boolean }[]
  aiRequests: { timestamp: number; success: boolean }[]
  lastCleanup: number
}>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  
  for (const [key, data] of requestStore.entries()) {
    // Remove entries older than 24 hours
    data.requests = data.requests.filter(req => now - req.timestamp < oneDay)
    data.aiRequests = data.aiRequests.filter(req => now - req.timestamp < oneDay)
    
    // Remove empty entries
    if (data.requests.length === 0 && data.aiRequests.length === 0) {
      requestStore.delete(key)
    } else {
      data.lastCleanup = now
    }
  }
}, 5 * 60 * 1000)

// Get client IP address
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

// Get or create request data for IP
function getRequestData(ip: string) {
  if (!requestStore.has(ip)) {
    requestStore.set(ip, {
      requests: [],
      aiRequests: [],
      lastCleanup: Date.now(),
    })
  }
  return requestStore.get(ip)!
}

// Check if IP is rate limited
export function checkRateLimit(request: NextRequest, isAIRequest = false): {
  allowed: boolean
  reason?: string
  retryAfter?: number
} {
  const ip = getClientIP(request)
  const now = Date.now()
  const data = getRequestData(ip)
  
  // Clean up old entries for this IP
  const oneMinute = 60 * 1000
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * 60 * 60 * 1000
  
  data.requests = data.requests.filter(req => now - req.timestamp < oneDay)
  data.aiRequests = data.aiRequests.filter(req => now - req.timestamp < oneDay)
  
  // Check rapid requests (abuse detection)
  const recentRequests = data.requests.filter(req => now - req.timestamp < 10000) // 10 seconds
  if (recentRequests.length >= RATE_LIMITS.ABUSE_DETECTION.RAPID_REQUESTS_THRESHOLD) {
    return {
      allowed: false,
      reason: 'Too many rapid requests detected',
      retryAfter: 60, // 1 minute
    }
  }
  
  // Check per-minute limit
  const requestsLastMinute = data.requests.filter(req => now - req.timestamp < oneMinute)
  if (requestsLastMinute.length >= RATE_LIMITS.PER_IP.REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: too many requests per minute',
      retryAfter: 60,
    }
  }
  
  // Check per-hour limit
  const requestsLastHour = data.requests.filter(req => now - req.timestamp < oneHour)
  if (requestsLastHour.length >= RATE_LIMITS.PER_IP.REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: too many requests per hour',
      retryAfter: 3600, // 1 hour
    }
  }
  
  // Check per-day limit
  if (data.requests.length >= RATE_LIMITS.PER_IP.REQUESTS_PER_DAY) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: daily limit reached',
      retryAfter: 86400, // 24 hours
    }
  }
  
  // Additional checks for AI requests
  if (isAIRequest) {
    const aiRequestsLastHour = data.aiRequests.filter(req => now - req.timestamp < oneHour)
    if (aiRequestsLastHour.length >= RATE_LIMITS.PER_IP.AI_REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        reason: 'AI rate limit exceeded: too many AI requests per hour',
        retryAfter: 3600,
      }
    }
    
    if (data.aiRequests.length >= RATE_LIMITS.PER_IP.AI_REQUESTS_PER_DAY) {
      return {
        allowed: false,
        reason: 'AI rate limit exceeded: daily AI limit reached',
        retryAfter: 86400,
      }
    }
    
    // Check for repeated failures (potential abuse)
    const failedRequestsLastHour = data.requests.filter(
      req => now - req.timestamp < oneHour && !req.success
    )
    if (failedRequestsLastHour.length >= RATE_LIMITS.ABUSE_DETECTION.REPEATED_FAILURES_THRESHOLD) {
      return {
        allowed: false,
        reason: 'Too many failed requests detected',
        retryAfter: 3600,
      }
    }
  }
  
  return { allowed: true }
}

// Record a request
export function recordRequest(request: NextRequest, endpoint: string, success: boolean, isAIRequest = false) {
  const ip = getClientIP(request)
  const data = getRequestData(ip)
  const now = Date.now()
  
  data.requests.push({
    timestamp: now,
    endpoint,
    success,
  })
  
  if (isAIRequest) {
    data.aiRequests.push({
      timestamp: now,
      success,
    })
  }
}

// Validate and sanitize content
export function validateContent(content: string): {
  valid: boolean
  sanitized?: string
  reason?: string
} {
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      reason: 'Content must be a non-empty string',
    }
  }
  
  // Check content length
  if (content.length > RATE_LIMITS.CONTENT.MAX_TEXT_LENGTH) {
    return {
      valid: false,
      reason: `Content too long. Maximum ${RATE_LIMITS.CONTENT.MAX_TEXT_LENGTH} characters allowed`,
    }
  }
  
  // Check for suspicious patterns
  for (const pattern of RATE_LIMITS.ABUSE_DETECTION.SUSPICIOUS_CONTENT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        valid: false,
        reason: 'Content contains suspicious patterns',
      }
    }
  }
  
  // Basic sanitization
  let sanitized = content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
  
  // Limit line length and total lines
  const lines = sanitized.split('\n')
  if (lines.length > 1000) {
    return {
      valid: false,
      reason: 'Content has too many lines (max 1000)',
    }
  }
  
  // Truncate extremely long lines
  sanitized = lines
    .map(line => line.length > 1000 ? line.substring(0, 1000) + '...' : line)
    .join('\n')
  
  return {
    valid: true,
    sanitized,
  }
}

// Check if request is from a suspicious source
export function checkSuspiciousRequest(request: NextRequest): {
  suspicious: boolean
  reason?: string
} {
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Check for bot-like user agents
  const botPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|node|go-http/i,
    /postman|insomnia|httpie/i,
  ]
  
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return {
        suspicious: true,
        reason: 'Automated request detected',
      }
    }
  }
  
  // Check for missing or suspicious headers
  if (!userAgent) {
    return {
      suspicious: true,
      reason: 'Missing user agent',
    }
  }
  
  // Check for suspicious referers (if present)
  if (referer && !referer.includes(request.headers.get('host') || '')) {
    // Allow common development and testing scenarios
    const allowedReferers = [
      'localhost',
      '127.0.0.1',
      'vercel.app',
      'netlify.app',
      'github.dev',
      'stackblitz.com',
      'codesandbox.io',
    ]
    
    const isAllowedReferer = allowedReferers.some(allowed => 
      referer.includes(allowed)
    )
    
    if (!isAllowedReferer) {
      return {
        suspicious: true,
        reason: 'Suspicious referer',
      }
    }
  }
  
  return { suspicious: false }
}

// Get rate limit status for monitoring
export function getRateLimitStatus(request: NextRequest) {
  const ip = getClientIP(request)
  const data = getRequestData(ip)
  const now = Date.now()
  
  const oneMinute = 60 * 1000
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * 60 * 60 * 1000
  
  return {
    ip,
    requests: {
      lastMinute: data.requests.filter(req => now - req.timestamp < oneMinute).length,
      lastHour: data.requests.filter(req => now - req.timestamp < oneHour).length,
      lastDay: data.requests.length,
    },
    aiRequests: {
      lastHour: data.aiRequests.filter(req => now - req.timestamp < oneHour).length,
      lastDay: data.aiRequests.length,
    },
    limits: RATE_LIMITS.PER_IP,
  }
}

// Security headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self' data:;",
} 