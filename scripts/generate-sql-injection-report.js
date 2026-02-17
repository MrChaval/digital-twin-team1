/**
 * SQL Injection Security Report Generator
 * Generates comprehensive reports from attack_logs database
 * 
 * Usage: node scripts/generate-sql-injection-report.js
 */

import { db, attackLogs } from '../lib/db.js';

async function generateSecurityReport() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   SQL INJECTION SECURITY REPORT                          ║');
  console.log('║   Digital Twin III: Cyber-Hardened Portfolio             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  try {
    // Fetch all attack logs
    const allAttacks = await db.select().from(attackLogs).execute();
    
    // Filter SQL injection attempts
    const sqlInjectionAttacks = allAttacks.filter(attack => 
      attack.type.includes('SQL_INJECTION')
    );
    
    // Generate statistics
    generateOverviewStats(sqlInjectionAttacks);
    generateSourceBreakdown(sqlInjectionAttacks);
    generateSeverityAnalysis(sqlInjectionAttacks);
    generateGeographicAnalysis(sqlInjectionAttacks);
    generateTimelineAnalysis(sqlInjectionAttacks);
    generateTopAttackPatterns(sqlInjectionAttacks);
    generateRecentAttacks(sqlInjectionAttacks);
    generateRecommendations(sqlInjectionAttacks);
    
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

function generateOverviewStats(attacks) {
  console.log('📊 OVERVIEW STATISTICS');
  console.log('═'.repeat(60));
  
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  const last1h = attacks.filter(a => a.timestamp && (now - new Date(a.timestamp).getTime()) <= hour).length;
  const last24h = attacks.filter(a => a.timestamp && (now - new Date(a.timestamp).getTime()) <= day).length;
  const last7d = attacks.filter(a => a.timestamp && (now - new Date(a.timestamp).getTime()) <= week).length;
  const last30d = attacks.filter(a => a.timestamp && (now - new Date(a.timestamp).getTime()) <= month).length;
  
  console.log(`Total SQL Injection Attempts:     ${attacks.length}`);
  console.log(`Last 1 Hour:                      ${last1h}`);
  console.log(`Last 24 Hours:                    ${last24h}`);
  console.log(`Last 7 Days:                      ${last7d}`);
  console.log(`Last 30 Days:                     ${last30d}`);
  console.log(`Unique IP Addresses:              ${new Set(attacks.map(a => a.ip)).size}`);
  console.log(`Unique Countries:                 ${new Set(attacks.filter(a => a.country).map(a => a.country)).size}`);
  console.log('\n');
}

function generateSourceBreakdown(attacks) {
  console.log('📍 ATTACK SOURCE BREAKDOWN');
  console.log('═'.repeat(60));
  
  const sourceCount = {};
  
  attacks.forEach(attack => {
    const sourceMatch = attack.type.match(/source:(\w+)/);
    if (sourceMatch) {
      const source = sourceMatch[1];
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    }
  });
  
  const sortedSources = Object.entries(sourceCount)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedSources.length === 0) {
    console.log('No source data available\n');
    return;
  }
  
  sortedSources.forEach(([source, count]) => {
    const percentage = ((count / attacks.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`${source.padEnd(25)} ${count.toString().padStart(5)} (${percentage}%) ${bar}`);
  });
  console.log('\n');
}

function generateSeverityAnalysis(attacks) {
  console.log('🔥 SEVERITY ANALYSIS');
  console.log('═'.repeat(60));
  
  const critical = attacks.filter(a => a.severity >= 9).length;
  const high = attacks.filter(a => a.severity >= 7 && a.severity < 9).length;
  const medium = attacks.filter(a => a.severity >= 4 && a.severity < 7).length;
  const low = attacks.filter(a => a.severity < 4).length;
  
  const total = attacks.length || 1;
  
  console.log(`🔴 Critical (9-10):   ${critical.toString().padStart(5)} (${((critical/total)*100).toFixed(1)}%)`);
  console.log(`🟠 High (7-8):        ${high.toString().padStart(5)} (${((high/total)*100).toFixed(1)}%)`);
  console.log(`🟡 Medium (4-6):      ${medium.toString().padStart(5)} (${((medium/total)*100).toFixed(1)}%)`);
  console.log(`🟢 Low (1-3):         ${low.toString().padStart(5)} (${((low/total)*100).toFixed(1)}%)`);
  console.log('\n');
}

function generateGeographicAnalysis(attacks) {
  console.log('🌍 GEOGRAPHIC ANALYSIS');
  console.log('═'.repeat(60));
  
  const countryCount = {};
  const cityCount = {};
  
  attacks.forEach(attack => {
    if (attack.country) {
      countryCount[attack.country] = (countryCount[attack.country] || 0) + 1;
    }
    if (attack.city && attack.country) {
      const location = `${attack.city}, ${attack.country}`;
      cityCount[location] = (cityCount[location] || 0) + 1;
    }
  });
  
  console.log('Top 10 Countries:');
  Object.entries(countryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([country, count], index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${country.padEnd(30)} ${count}`);
    });
  
  console.log('\nTop 10 Cities:');
  Object.entries(cityCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([city, count], index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${city.padEnd(30)} ${count}`);
    });
  console.log('\n');
}

function generateTimelineAnalysis(attacks) {
  const hourlyDistribution = new Array(24).fill(0);
  
  attacks.forEach(attack => {
    if (attack.timestamp) {
      const hour = new Date(attack.timestamp).getHours();
      hourlyDistribution[hour]++;
    }
  });
  
  console.log('📈 HOURLY DISTRIBUTION (UTC)');
  console.log('═'.repeat(60));
  
  const maxCount = Math.max(...hourlyDistribution);
  
  for (let hour = 0; hour < 24; hour++) {
    const count = hourlyDistribution[hour];
    const barLength = maxCount > 0 ? Math.floor((count / maxCount) * 40) : 0;
    const bar = '▓'.repeat(barLength);
    console.log(`${hour.toString().padStart(2)}:00  ${count.toString().padStart(4)} ${bar}`);
  }
  console.log('\n');
}

function generateTopAttackPatterns(attacks) {
  console.log('🎯 TOP ATTACK PATTERNS');
  console.log('═'.repeat(60));
  
  const patterns = {};
  
  attacks.forEach(attack => {
    const patternsMatch = attack.type.match(/patterns:(\d+)/);
    if (patternsMatch) {
      const patternCount = patternsMatch[1];
      patterns[patternCount] = (patterns[patternCount] || 0) + 1;
    }
  });
  
  console.log('Attacks by Number of Patterns Detected:');
  Object.entries(patterns)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .forEach(([patternCount, attackCount]) => {
      console.log(`  ${patternCount} patterns: ${attackCount} attacks`);
    });
  console.log('\n');
}

function generateRecentAttacks(attacks) {
  console.log('🕒 RECENT ATTACKS (Last 10)');
  console.log('═'.repeat(60));
  
  const recent = attacks
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 10);
  
  recent.forEach((attack, index) => {
    const time = attack.timestamp ? new Date(attack.timestamp).toLocaleString() : 'Unknown';
    const location = attack.city && attack.country 
      ? `${attack.city}, ${attack.country}` 
      : attack.country || 'Unknown';
    
    const sourceMatch = attack.type.match(/source:(\w+)/);
    const source = sourceMatch ? sourceMatch[1] : 'unknown';
    
    console.log(`\n${index + 1}. ${time}`);
    console.log(`   IP: ${attack.ip}`);
    console.log(`   Source: ${source}`);
    console.log(`   Severity: ${attack.severity}/10`);
    console.log(`   Location: ${location}`);
  });
  console.log('\n');
}

function generateRecommendations(attacks) {
  console.log('💡 SECURITY RECOMMENDATIONS');
  console.log('═'.repeat(60));
  
  const critical = attacks.filter(a => a.severity >= 9).length;
  const last24h = attacks.filter(a => 
    a.timestamp && (Date.now() - new Date(a.timestamp).getTime()) <= 24*60*60*1000
  ).length;
  
  const recommendations = [];
  
  if (critical > 0) {
    recommendations.push('⚠️  CRITICAL: Review and address high-severity SQL injection attempts');
  }
  
  if (last24h > 10) {
    recommendations.push('⚠️  HIGH Activity: Consider implementing additional rate limiting');
  }
  
  if (attacks.length > 50) {
    recommendations.push('✅ GOOD: Logging system capturing attacks effectively');
  }
  
  recommendations.push('✅ Continue monitoring attack logs regularly');
  recommendations.push('✅ Review and update SQL injection patterns periodically');
  recommendations.push('✅ Ensure all input validation layers are active');
  recommendations.push('✅ Test protection mechanisms with penetration testing');
  
  recommendations.forEach(rec => console.log(rec));
  console.log('\n');
}

// Export report data for programmatic use
export function getSecurityMetrics() {
  return {
    totalAttempts: attacks.length,
    uniqueIPs: new Set(attacks.map(a => a.ip)).size,
    bySeverity: {
      critical: attacks.filter(a => a.severity >= 9).length,
      high: attacks.filter(a => a.severity >= 7 && a.severity < 9).length,
      medium: attacks.filter(a => a.severity >= 4 && a.severity < 7).length,
      low: attacks.filter(a => a.severity < 4).length,
    }
  };
}

// Run report if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSecurityReport()
    .then(() => {
      console.log('Report generated successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to generate report:', error);
      process.exit(1);
    });
}
