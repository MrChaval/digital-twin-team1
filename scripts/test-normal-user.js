/**
 * Normal User Test Script
 * Verifies that normal browser users can access the website
 */

const BASE_URL = "http://localhost:3000";

// Normal browser user agents
const normalUsers = [
  {
    name: "Chrome (Windows)",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  {
    name: "Firefox (macOS)",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0",
  },
  {
    name: "Safari (iOS)",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  },
  {
    name: "Edge (Windows)",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  },
];

async function testNormalUser(user) {
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        "User-Agent": user.userAgent,
      },
    });

    const success = response.ok;
    const status = success ? "✅ ALLOWED" : `❌ BLOCKED (${response.status})`;

    console.log(`${status} | ${user.name}`);
    
    return success;
  } catch (error) {
    console.log(`❌ ERROR | ${user.name} | ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("\n👤 Normal User Access Test");
  console.log("=".repeat(60));
  console.log(`Testing against: ${BASE_URL}\n`);

  let passed = 0;
  for (const user of normalUsers) {
    const success = await testNormalUser(user);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📈 Result: ${passed}/${normalUsers.length} users can access`);
  console.log(`${passed === normalUsers.length ? "✅ All normal users allowed" : "❌ Some users blocked"}`);
  console.log("=".repeat(60) + "\n");

  process.exit(passed === normalUsers.length ? 0 : 1);
}

runTests().catch((error) => {
  console.error("Test error:", error);
  process.exit(1);
});
