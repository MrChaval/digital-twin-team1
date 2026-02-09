/**
 * Test script to verify Arcjet rate limiting is working
 * Run: node scripts/test-rate-limit.js
 * 
 * Make sure your dev server is running: pnpm dev
 */

const API_URL = 'http://localhost:3000/api/arcjet';
const TOTAL_REQUESTS = 15; // More than the limit of 10
const DELAY_BETWEEN_REQUESTS = 100; // ms

async function testRateLimit() {
  console.log('🧪 Testing Arcjet Rate Limiting...\n');
  console.log(`Configuration: 10 requests per 10 seconds`);
  console.log(`Sending ${TOTAL_REQUESTS} requests...\n`);

  let allowedCount = 0;
  let deniedCount = 0;
  let firstDeniedAt = null;

  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(API_URL);
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok) {
        allowedCount++;
        console.log(`✅ Request ${i}: ALLOWED (${duration}ms) - ${data.message}`);
      } else if (response.status === 403) {
        deniedCount++;
        if (!firstDeniedAt) firstDeniedAt = i;
        console.log(`🚫 Request ${i}: BLOCKED (${duration}ms) - Reason: ${data.reason}`);
        console.log(`   Details:`, JSON.stringify(data.ruleResults || data.blockedBy, null, 2));
      } else {
        console.log(`⚠️  Request ${i}: ERROR (${response.status}) - ${data.message}`);
      }

      // Small delay between requests
      if (i < TOTAL_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    } catch (error) {
      console.error(`❌ Request ${i}: FAILED - ${error.message}`);
      console.error('   Make sure your dev server is running: pnpm dev');
      break;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS:');
  console.log('='.repeat(60));
  console.log(`✅ Allowed:  ${allowedCount} requests`);
  console.log(`🚫 Blocked:  ${deniedCount} requests`);
  if (firstDeniedAt) {
    console.log(`⚡ Rate limit triggered at request #${firstDeniedAt}`);
  }
  console.log('='.repeat(60));

  if (deniedCount > 0 && allowedCount <= 10) {
    console.log('\n✅ SUCCESS: Rate limiting is working correctly!');
    console.log('   Requests were blocked after exceeding the limit.');
  } else if (deniedCount === 0) {
    console.log('\n⚠️  WARNING: No requests were blocked.');
    console.log('   Possible reasons:');
    console.log('   1. ARCJET_KEY might not be configured correctly');
    console.log('   2. Rate limiting might be in DRY_RUN mode');
    console.log('   3. Arcjet service might be unreachable');
  } else {
    console.log('\n⚠️  UNEXPECTED: More than 10 requests were allowed.');
    console.log('   Check your rate limit configuration.');
  }

  console.log('\n💡 To reset the rate limit, wait 10 seconds and try again.\n');
}

// Run the test
testRateLimit().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
