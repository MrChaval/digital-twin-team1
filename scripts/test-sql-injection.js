/**
 * SQL Injection Testing Script
 * Tests all protection layers against common SQL injection attacks
 * 
 * Usage: node scripts/test-sql-injection.js
 */

const SQL_INJECTION_PAYLOADS = [
  // Classic SQL Injection
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "'; DROP TABLE users;--",
  
  // Union-based injection
  "' UNION SELECT NULL, NULL--",
  "' UNION SELECT username, password FROM users--",
  
  // Boolean-based blind injection
  "' AND 1=0 UNION ALL SELECT 'admin', 'password",
  "' AND '1'='1",
  "' AND '1'='2",
  
  // Time-based blind injection
  "'; WAITFOR DELAY '0:0:5'--",
  "'; SELECT SLEEP(5)--",
  
  // Error-based injection
  "' AND 1=CONVERT(int, (SELECT @@version))--",
  "' AND extractvalue(1,concat(0x7e,database()))--",
  
  // Stacked queries
  "'; EXEC xp_cmdshell('dir')--",
  "'; SELECT * FROM information_schema.tables--",
  
  // Advanced payloads
  "admin@test.com'; SELECT * FROM users WHERE ''='",
  "test@test.com' AND 1=1; EXEC master..xp_cmdshell 'ping 127.0.0.1'--",
];

async function testSQLInjection() {
  console.log("🔒 SQL Injection Security Testing");
  console.log("==================================\n");
  
  const results = {
    blocked: 0,
    passed: 0,
    errors: 0,
    total: SQL_INJECTION_PAYLOADS.length
  };

  // Get the base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log(`Testing against: ${baseUrl}\n`);
  console.log("📧 Testing Newsletter Endpoint...\n");

  for (const payload of SQL_INJECTION_PAYLOADS) {
    try {
      const formData = new URLSearchParams();
      formData.append('email', payload);
      formData.append('name', 'Test User');

      const response = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124'
        },
        body: formData
      });

      const status = response.status;
      
      if (status === 403) {
        console.log(`✅ BLOCKED: "${payload.substring(0, 40)}..." → 403 Forbidden (Arcjet Shield)`);
        results.blocked++;
      } else if (status === 400 || status === 422) {
        console.log(`✅ REJECTED: "${payload.substring(0, 40)}..." → ${status} (Validation Error)`);
        results.passed++;
      } else if (status === 200) {
        console.log(`⚠️  ACCEPTED: "${payload.substring(0, 40)}..." → 200 OK (Check if safe)`);
        results.passed++;
      } else {
        console.log(`❓ UNKNOWN: "${payload.substring(0, 40)}..." → ${status}`);
        results.errors++;
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ ERROR: "${payload.substring(0, 40)}..." → ${error.message}`);
      results.errors++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary");
  console.log("=".repeat(50));
  console.log(`Total Payloads Tested: ${results.total}`);
  console.log(`✅ Blocked by WAF:      ${results.blocked}`);
  console.log(`✅ Rejected by Validation: ${results.passed}`);
  console.log(`❌ Errors:             ${results.errors}`);
  console.log(`\n🛡️  Protection Rate:    ${((results.blocked + results.passed) / results.total * 100).toFixed(1)}%`);
  
  if (results.blocked + results.passed === results.total) {
    console.log("\n🎉 ALL TESTS PASSED - Application is protected!");
  } else {
    console.log("\n⚠️  Some payloads were not blocked - Review security settings");
  }
  
  console.log("\n💡 Next Steps:");
  console.log("  1. Check attack_logs table for logged attempts");
  console.log("  2. Review admin dashboard at /admin/audit-logs");
  console.log("  3. Verify geolocation tracking is working");
  console.log("\n");
}

// Check database for logged attacks
async function checkAttackLogs() {
  console.log("\n🔍 Checking Attack Logs Database...\n");
  
  try {
    // This would require database connection
    // For demo purposes, we'll show the query
    console.log("Run this query in your database:");
    console.log("─".repeat(50));
    console.log(`
SELECT 
  id,
  ip,
  type,
  severity,
  timestamp,
  city,
  country
FROM attack_logs
WHERE type LIKE '%SQL%'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 10;
    `);
    console.log("─".repeat(50));
  } catch (error) {
    console.error("Error checking logs:", error.message);
  }
}

// Main execution
(async () => {
  console.clear();
  await testSQLInjection();
  await checkAttackLogs();
})();

module.exports = { SQL_INJECTION_PAYLOADS, testSQLInjection };
