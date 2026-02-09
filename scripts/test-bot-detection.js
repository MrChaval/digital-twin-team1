/**
 * Bot Detection Test Script
 * Tests Arcjet bot detection with good and bad bot user agents
 * 
 * Good bots (allowed):
 * - Googlebot (search engine)
 * - Bingbot (search engine)
 * - DuckDuckBot (search engine)
 * 
 * Bad bots (blocked):
 * - Generic scrapers
 * - Automated tools
 * - Unknown bots
 */

const BASE_URL = "http://localhost:3000";

// Good bots - these should be ALLOWED
const goodBots = [
  {
    name: "Googlebot",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    category: "Search Engine",
  },
  {
    name: "Bingbot",
    userAgent: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    category: "Search Engine",
  },
  {
    name: "DuckDuckBot",
    userAgent: "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)",
    category: "Search Engine",
  },
];

// Bad bots - these should be BLOCKED
const badBots = [
  {
    name: "Generic Scraper",
    userAgent: "Mozilla/5.0 (compatible; ScrapyBot/1.0)",
    category: "Web Scraper",
  },
  {
    name: "Python Requests",
    userAgent: "python-requests/2.28.0",
    category: "Automated Tool",
  },
  {
    name: "Curl",
    userAgent: "curl/7.68.0",
    category: "Command Line Tool",
  },
  {
    name: "Wget",
    userAgent: "Wget/1.20.3 (linux-gnu)",
    category: "Download Tool",
  },
  {
    name: "Unknown Bot",
    userAgent: "BadBot/1.0",
    category: "Unknown Bot",
  },
];

async function testBot(bot, expectedResult) {
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        "User-Agent": bot.userAgent,
      },
    });

    const success = expectedResult === "ALLOW" ? response.ok : response.status === 403;
    const status = success ? "✅ PASS" : "❌ FAIL";
    const result = response.ok ? "ALLOWED" : `BLOCKED (${response.status})`;

    console.log(`${status} | ${bot.name.padEnd(20)} | ${result.padEnd(15)} | ${bot.category}`);
    
    return success;
  } catch (error) {
    console.log(`❌ ERROR | ${bot.name.padEnd(20)} | Network Error`);
    return false;
  }
}

async function runTests() {
  console.log("\n🤖 Bot Detection Test Suite");
  console.log("=" .repeat(80));
  console.log(`Testing against: ${BASE_URL}\n`);

  // Test good bots (should be allowed)
  console.log("📊 Good Bots (Should be ALLOWED):");
  console.log("-".repeat(80));
  let goodBotsPassed = 0;
  for (const bot of goodBots) {
    const passed = await testBot(bot, "ALLOW");
    if (passed) goodBotsPassed++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
  }

  console.log("\n📊 Bad Bots (Should be BLOCKED):");
  console.log("-".repeat(80));
  let badBotsPassed = 0;
  for (const bot of badBots) {
    const passed = await testBot(bot, "BLOCK");
    if (passed) badBotsPassed++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📈 Test Summary:");
  console.log(`   Good Bots: ${goodBotsPassed}/${goodBots.length} passed`);
  console.log(`   Bad Bots:  ${badBotsPassed}/${badBots.length} passed`);
  console.log(`   Total:     ${goodBotsPassed + badBotsPassed}/${goodBots.length + badBots.length} passed`);
  
  const allPassed = goodBotsPassed === goodBots.length && badBotsPassed === badBots.length;
  console.log(`\n${allPassed ? "✅ All tests passed!" : "❌ Some tests failed"}`);
  console.log("=".repeat(80) + "\n");

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
  console.error("Test suite error:", error);
  process.exit(1);
});
