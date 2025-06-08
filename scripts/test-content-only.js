// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...options.headers
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return {
      status: 0,
      data: { error: error.message },
      headers: {}
    };
  }
}

async function testContentValidation() {
  console.log('📝 Testing Content Validation (Isolated)...');
  
  // Test oversized content
  console.log('\n1. Testing oversized content (60KB > 50KB limit)...');
  const largeContent = 'x'.repeat(60000); // 60KB (over 50KB limit)
  const oversizeResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: largeContent }
  });
  
  console.log(`   Status: ${oversizeResult.status}`);
  console.log(`   Result: ${oversizeResult.status === 400 ? 'BLOCKED ✅' : 'ALLOWED ❌'}`);
  if (oversizeResult.data.error) {
    console.log(`   Error: ${oversizeResult.data.error}`);
  }
  
  // Wait a bit to avoid rapid request detection
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test suspicious content patterns
  console.log('\n2. Testing XSS pattern detection...');
  const suspiciousContent = '<script>alert("xss")</script>';
  const xssResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: suspiciousContent }
  });
  
  console.log(`   Status: ${xssResult.status}`);
  console.log(`   Result: ${xssResult.status === 400 ? 'BLOCKED ✅' : 'ALLOWED ❌'}`);
  if (xssResult.data.error) {
    console.log(`   Error: ${xssResult.data.error}`);
  }
  
  // Wait a bit to avoid rapid request detection
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test empty content
  console.log('\n3. Testing empty content...');
  const emptyResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: '' }
  });
  
  console.log(`   Status: ${emptyResult.status}`);
  console.log(`   Result: ${emptyResult.status === 400 ? 'BLOCKED ✅' : 'ALLOWED ❌'}`);
  if (emptyResult.data.error) {
    console.log(`   Error: ${emptyResult.data.error}`);
  }
  
  // Wait a bit to avoid rapid request detection
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test normal content (should work)
  console.log('\n4. Testing normal content (should work)...');
  const normalResult = await makeRequest('/api/process-event', {
    method: 'POST',
    body: { content: 'Meeting tomorrow at 2pm in the conference room' }
  });
  
  console.log(`   Status: ${normalResult.status}`);
  console.log(`   Result: ${normalResult.status === 200 ? 'ALLOWED ✅' : 'BLOCKED ❌'}`);
  if (normalResult.data.error) {
    console.log(`   Error: ${normalResult.data.error}`);
  }
}

// Run the test
testContentValidation().catch(console.error); 