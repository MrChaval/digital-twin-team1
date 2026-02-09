/**
 * Test script to diagnose Arcjet errors
 * Run: node scripts/test-arcjet-errors.js
 */

const API_URL = 'http://localhost:3000/api/arcjet';

async function testArcjetErrors() {
  console.log('🔍 Testing Arcjet Error Detection...\n');

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (response.status === 503) {
      console.log('\n❌ ARCJET ERROR DETECTED!');
      console.log('Error message:', data.error || data.message);
      console.log('\nTroubleshooting steps:');
      console.log('1. Check ARCJET_KEY in .env.local is correct');
      console.log('2. Verify network connectivity to https://decide.arcjet.com');
      console.log('3. Check Arcjet dashboard: https://app.arcjet.com');
      console.log('4. Look at dev server console for detailed error logs');
    } else if (response.status === 200) {
      console.log('\n✅ Arcjet is working!');
      console.log('Protection details:', data.protection);
      console.log('\nRule results:');
      data.ruleResults.forEach((result, i) => {
        console.log(`  ${i + 1}. State: ${result.state}, Conclusion: ${result.conclusion}`);
        if (result.reason.type) {
          console.log(`     Type: ${result.reason.type}`);
        }
      });
    } else if (response.status === 403) {
      console.log('\n🚫 Request blocked (this is expected behavior)');
      console.log('Reason:', data.reason);
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. Dev server is running: pnpm dev');
    console.error('2. Server is accessible on http://localhost:3000');
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 TIP: Check your dev server terminal for detailed logs');
  console.log('='.repeat(60) + '\n');
}

testArcjetErrors();
