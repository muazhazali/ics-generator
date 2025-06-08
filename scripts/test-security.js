#!/usr/bin/env node

/**
 * Security Testing Script for ICS Generator
 * 
 * This script tests various security measures including:
 * - Rate limiting
 * - Content validation
 * - Suspicious request detection
 * - File upload security
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

// Test utilities
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTestScript/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testRateLimiting() {
  console.log('\n🔄 Testing Rate Limiting...');
  
  const requests = [];
  const startTime = Date.now();
  
  // Send 15 rapid requests (should trigger rate limiting)
  for (let i = 0; i < 15; i++) {
    requests.push(
      makeRequest('/api/process-event', {
        method: 'POST',
        body: { content: `Test content ${i}` }
      })
    );
  }
  
  const results = await Promise.all(requests);
  const rateLimited = results.filter(r => r.status === 429);
  const successful = results.filter(r => r.status === 200);
  
  console.log(`✅ Sent 15 rapid requests in ${Date.now() - startTime}ms`);
  console.log(`✅ Successful requests: ${successful.length}`);
  console.log(`✅ Rate limited requests: ${rateLimited.length}`);
  
  if (rateLimited.length > 0) {
    console.log(`✅ Rate limiting is working! First rate limit at request ${successful.length + 1}`);
    console.log(`   Error: ${rateLimited[0].data.error}`);
    console.log(`   Retry-After: ${rateLimited[0].data.retryAfter}s`);
  } else {
    console.log('⚠️  Rate limiting may not be working properly');
  }
}

async function testContentValidation() {
  console.log('\n📝 Testing Content Validation...');
  
  // Test oversized content
  const largeContent = 'x'.repeat(60000); // 60KB (over 50KB limit)
  const oversizeResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: largeContent }
  });
  
  console.log(`✅ Oversized content test: ${oversizeResult.status === 400 ? 'BLOCKED' : 'ALLOWED'}`);
  if (oversizeResult.status === 400) {
    console.log(`   Error: ${oversizeResult.data.error}`);
  }
  
  // Test suspicious content patterns
  const suspiciousContent = '<script>alert("xss")</script>';
  const xssResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: suspiciousContent }
  });
  
  console.log(`✅ XSS pattern test: ${xssResult.status === 400 ? 'BLOCKED' : 'ALLOWED'}`);
  if (xssResult.status === 400) {
    console.log(`   Error: ${xssResult.data.error}`);
  }
  
  // Test empty content
  const emptyResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: '' }
  });
  
  console.log(`✅ Empty content test: ${emptyResult.status === 400 ? 'BLOCKED' : 'ALLOWED'}`);
  if (emptyResult.status === 400) {
    console.log(`   Error: ${emptyResult.data.error}`);
  }
}

async function testSuspiciousRequests() {
  console.log('\n🤖 Testing Suspicious Request Detection...');
  
  // Test without User-Agent
  const noUserAgentResult = await makeRequest('/api/process-event', {
    method: 'POST',
    headers: { 'User-Agent': '' },
    body: { content: 'test' }
  });
  
  console.log(`✅ No User-Agent test: ${noUserAgentResult.status === 400 ? 'BLOCKED' : 'ALLOWED'}`);
  
  // Test with bot-like User-Agent
  const botResult = await makeRequest('/api/process-event', {
    method: 'POST',
    headers: { 'User-Agent': 'curl/7.68.0' },
    body: { content: 'test' }
  });
  
  console.log(`✅ Bot User-Agent test: ${botResult.status === 403 ? 'BLOCKED' : 'ALLOWED'}`);
  
  // Test with wrong Content-Type
  const wrongContentTypeResult = await makeRequest('/api/process-event', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: { content: 'test' }
  });
  
  console.log(`✅ Wrong Content-Type test: ${wrongContentTypeResult.status === 400 ? 'BLOCKED' : 'ALLOWED'}`);
}

async function testSecurityHeaders() {
  console.log('\n🛡️  Testing Security Headers...');
  
  const result = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: 'test' }
  });
  
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy'
  ];
  
  securityHeaders.forEach(header => {
    const present = result.headers[header] ? '✅' : '❌';
    console.log(`${present} ${header}: ${result.headers[header] || 'MISSING'}`);
  });
}

async function testAdminEndpoint() {
  console.log('\n👨‍💼 Testing Admin Endpoint...');
  
  // Test without authentication
  const unauthResult = await makeRequest('/api/admin/stats');
  console.log(`✅ Unauthenticated access: ${unauthResult.status === 401 ? 'BLOCKED' : 'ALLOWED'}`);
  
  // Test with authentication
  const authResult = await makeRequest('/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  console.log(`✅ Authenticated access: ${authResult.status === 200 ? 'ALLOWED' : 'BLOCKED'}`);
  
  if (authResult.status === 200) {
    console.log(`✅ Admin stats retrieved successfully`);
    console.log(`   Current IP: ${authResult.data.currentIP?.ip}`);
    console.log(`   Requests today: ${authResult.data.currentIP?.requests?.lastDay || 0}`);
  }
}

async function testTimezoneEndpoint() {
  console.log('\n🌍 Testing Timezone Endpoint...');
  
  // Test valid timezone
  const validResult = await makeRequest('/api/detect-timezone', {
    method: 'POST',
    body: { timezone: 'America/New_York' }
  });
  console.log(`✅ Valid timezone: ${validResult.status === 200 ? 'ACCEPTED' : 'REJECTED'}`);
  
  // Test invalid timezone
  const invalidResult = await makeRequest('/api/detect-timezone', {
    method: 'POST',
    body: { timezone: 'Invalid/Timezone' }
  });
  console.log(`✅ Invalid timezone: ${invalidResult.status === 400 ? 'REJECTED' : 'ACCEPTED'}`);
  
  // Test oversized timezone string
  const oversizeResult = await makeRequest('/api/detect-timezone', {
    method: 'POST',
    body: { timezone: 'x'.repeat(100) }
  });
  console.log(`✅ Oversized timezone: ${oversizeResult.status === 400 ? 'REJECTED' : 'ACCEPTED'}`);
}

// Main test runner
async function runSecurityTests() {
  console.log('🔒 ICS Generator Security Test Suite');
  console.log(`🎯 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(50));
  
  try {
    await testRateLimiting();
    await sleep(1000); // Brief pause between test suites
    
    await testContentValidation();
    await sleep(1000);
    
    await testSuspiciousRequests();
    await sleep(1000);
    
    await testSecurityHeaders();
    await sleep(1000);
    
    await testTimezoneEndpoint();
    await sleep(1000);
    
    await testAdminEndpoint();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Security test suite completed!');
    console.log('\n💡 Tips:');
    console.log('   - Monitor your application logs during these tests');
    console.log('   - Check the admin endpoint for rate limit statistics');
    console.log('   - Adjust rate limits in lib/security.ts if needed');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runSecurityTests();
}

module.exports = {
  runSecurityTests,
  testRateLimiting,
  testContentValidation,
  testSuspiciousRequests,
  testSecurityHeaders,
  testAdminEndpoint,
  testTimezoneEndpoint
}; 