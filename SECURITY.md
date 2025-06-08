# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the ICS Generator to prevent misuse and abuse of the AI API integration.

## 🛡️ Implemented Security Measures

### 1. Rate Limiting

**Per-IP Limits:**
- **Requests per minute:** 10
- **Requests per hour:** 50  
- **Requests per day:** 200
- **AI requests per hour:** 20
- **AI requests per day:** 100

**Abuse Detection:**
- **Rapid requests threshold:** 5 requests in 10 seconds
- **Failed requests threshold:** 10 failed requests per hour
- **Automatic blocking:** Temporary IP blocking for suspicious behavior

### 2. Content Validation & Sanitization

**Content Limits:**
- **Maximum text length:** 50,000 characters (50KB)
- **Maximum file size:** 25MB
- **Maximum lines:** 1,000 lines
- **Maximum line length:** 1,000 characters (auto-truncated)

**Suspicious Content Detection:**
- Repeated content patterns (potential spam)
- Large non-ASCII content blocks
- Potential XSS patterns (`<script>`, `javascript:`, etc.)
- Control character removal

### 3. File Upload Security

**File Validation:**
- **Allowed types:** PDF, TXT, DOCX, Images (PNG, JPG, JPEG, GIF, BMP, TIFF, WebP, HEIC)
- **Blocked extensions:** `.exe`, `.bat`, `.cmd`, `.scr`, `.dll`, `.vbs`, `.js`, etc.
- **File name validation:** No suspicious characters or patterns
- **Size limits:** 25MB maximum per file

### 4. Request Authentication & Validation

**Header Requirements:**
- **User-Agent:** Required (blocks headless requests)
- **Content-Type:** Must be `application/json` for POST requests
- **Referer validation:** Checks for suspicious cross-origin requests

**Bot Detection:**
- Blocks common bot user agents
- Detects automated tools (curl, wget, Postman, etc.)
- Allows legitimate development tools in development mode

### 5. Security Headers

**Implemented Headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [Restrictive CSP]
```

### 6. CORS Protection

**Configuration:**
- **Development:** Allows all origins (`*`)
- **Production:** Restricted to specific domains
- **Methods:** Limited to `GET`, `POST`, `OPTIONS`
- **Headers:** Controlled header access

### 7. API Monitoring & Logging

**Request Tracking:**
- IP address logging
- Request timestamp tracking
- Success/failure rate monitoring
- Processing time measurement

**Admin Monitoring:**
- `/api/admin/stats` endpoint for usage statistics
- Rate limit status monitoring
- Abuse pattern detection
- Emergency IP reset functionality

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Required
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Optional Security Configuration
ADMIN_TOKEN=your_secure_admin_token_here
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

### Rate Limit Customization

You can customize rate limits by modifying `lib/security.ts`:

```typescript
const RATE_LIMITS = {
  PER_IP: {
    REQUESTS_PER_MINUTE: 10,    // Adjust as needed
    REQUESTS_PER_HOUR: 50,      // Adjust as needed
    AI_REQUESTS_PER_HOUR: 20,   // Adjust as needed
    // ... other limits
  }
}
```

## 📊 Monitoring & Analytics

### Admin Dashboard

Access usage statistics via the admin endpoint:

```bash
curl -H "Authorization: Bearer your_admin_token" \
     https://your-domain.com/api/admin/stats
```

**Response includes:**
- Current IP statistics
- Request counts (minute/hour/day)
- AI request usage
- Rate limit status

### Log Monitoring

Monitor application logs for:
- **Rate limit violations:** `Rate limit exceeded`
- **Suspicious requests:** `Suspicious request from IP`
- **Processing errors:** `Request failed from IP`
- **Security blocks:** `Request blocked for security reasons`

## 🚨 Incident Response

### Handling Abuse

1. **Identify the abusive IP** from logs
2. **Check current usage** via admin endpoint
3. **Reset rate limits** if needed:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer your_admin_token" \
        -H "Content-Type: application/json" \
        -d '{"action": "reset", "ip": "abusive.ip.address"}' \
        https://your-domain.com/api/admin/stats
   ```

### Emergency Measures

If under severe attack:

1. **Reduce rate limits** in `lib/security.ts`
2. **Enable stricter validation** in content filters
3. **Add IP blocking** at infrastructure level
4. **Monitor API costs** in Cerebras dashboard

## 🔒 Production Deployment Checklist

### Before Deployment:

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Set strong `ADMIN_TOKEN`
- [ ] Remove `.env.local` from repository
- [ ] Configure proper domain in middleware CORS
- [ ] Set up monitoring alerts
- [ ] Test rate limiting functionality
- [ ] Verify security headers are applied

### Infrastructure Security:

- [ ] Use HTTPS only
- [ ] Configure firewall rules
- [ ] Set up DDoS protection (Cloudflare, etc.)
- [ ] Enable request logging
- [ ] Set up monitoring alerts
- [ ] Configure backup systems

## 📈 Performance Considerations

### Memory Usage

The current implementation uses in-memory storage for rate limiting. For production at scale:

1. **Use Redis** for distributed rate limiting
2. **Implement data cleanup** for old entries
3. **Monitor memory usage** of the rate limiting store

### Scaling Recommendations

For high-traffic deployments:

1. **Database storage** for request tracking
2. **Redis cluster** for rate limiting
3. **Load balancer** with sticky sessions
4. **Separate monitoring service**

## 🔍 Security Testing

### Manual Testing

Test rate limiting:
```bash
# Test rapid requests
for i in {1..15}; do
  curl -X POST \
       -H "Content-Type: application/json" \
       -d '{"content": "test"}' \
       https://your-domain.com/api/process-event
done
```

Test content validation:
```bash
# Test oversized content
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"content": "'$(python -c 'print("x" * 60000)')'"}' \
     https://your-domain.com/api/process-event
```

### Automated Testing

Consider implementing:
- **Unit tests** for security functions
- **Integration tests** for rate limiting
- **Load testing** for performance validation
- **Security scanning** tools

## 📞 Support & Updates

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. **Email** security concerns to: [your-security-email]
3. **Include** detailed reproduction steps
4. **Wait** for acknowledgment before disclosure

### Regular Maintenance

- **Review logs** weekly for abuse patterns
- **Update dependencies** monthly
- **Review rate limits** based on usage patterns
- **Monitor API costs** and adjust limits accordingly

---

## 🎯 Quick Reference

### Common Rate Limit Responses

```json
{
  "error": "Rate limit exceeded: too many requests per minute",
  "retryAfter": 60
}
```

### Security Headers Check

```bash
curl -I https://your-domain.com/api/process-event
```

### Admin Stats Example

```json
{
  "currentIP": {
    "ip": "192.168.1.1",
    "requests": { "lastMinute": 2, "lastHour": 15, "lastDay": 45 },
    "aiRequests": { "lastHour": 8, "lastDay": 25 }
  },
  "systemLimits": {
    "perMinute": 10,
    "perHour": 50,
    "aiPerHour": 20
  }
}
```

This comprehensive security implementation provides robust protection against common attack vectors while maintaining usability for legitimate users. 