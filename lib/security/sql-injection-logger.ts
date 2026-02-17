/**
 * SQL Injection Attack Logger
 * Comprehensive logging system for SQL injection attempts across all inputs
 * Part of Zero Trust Security Architecture
 */

'use server';

import { db, attackLogs } from "@/lib/db";
import { headers } from "next/headers";

// ============================================================================
// SQL INJECTION PATTERN DETECTION
// ============================================================================

/**
 * Common SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  // Classic SQL injection
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
  /['";]\s*(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
  
  // Comment injection
  /--\s*$/,
  /\/\*.*?\*\//,
  /#\s*$/,
  
  // Union-based injection
  /\bUNION\b.*\bSELECT\b/gi,
  /\bUNION\b.*\bALL\b.*\bSELECT\b/gi,
  
  // Stacked queries
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/gi,
  
  // SQL keywords with suspicious context
  /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE)\s+(TABLE|DATABASE|SCHEMA)\b/gi,
  /\bEXEC\s+\w+/gi,
  /\bxp_cmdshell\b/gi,
  
  // Time-based blind injection
  /\b(SLEEP|WAITFOR|BENCHMARK|pg_sleep)\s*\(/gi,
  
  // Error-based injection
  /\b(extractvalue|updatexml|floor|rand|exp)\s*\(/gi,
  
  // Information schema access
  /\binformation_schema\b/gi,
  
  // Database version detection
  /@@version|version\(\)/gi,
  
  // Quote escaping attempts
  /\\['"]|['"]\\|%27|%22/,
  
  // Hex encoding
  /0x[0-9a-f]+/gi,
  
  // String concatenation
  /CONCAT\s*\(/gi,
  /\|\|/,
];

/**
 * Input sources to monitor
 */
export type InputSource = 
  | 'newsletter_email'
  | 'newsletter_name'
  | 'chatbot_message'
  | 'project_title'
  | 'project_description'
  | 'project_icon'
  | 'project_items'
  | 'contact_name'
  | 'contact_email'
  | 'contact_message'
  | 'search_query'
  | 'url_parameter'
  | 'unknown';

/**
 * SQL injection attack metadata
 */
export interface SQLInjectionAttempt {
  inputValue: string;
  inputSource: InputSource;
  detectedPatterns: string[];
  confidence: number;
  userAgent?: string;
  referer?: string;
  requestMethod?: string;
  timestamp: Date;
}

// ============================================================================
// PATTERN DETECTION & ANALYSIS
// ============================================================================

/**
 * Detect SQL injection patterns in user input
 * Returns detected patterns and confidence score (0-1)
 */
export function detectSQLInjection(input: string): {
  detected: boolean;
  patterns: string[];
  confidence: number;
} {
  if (!input || typeof input !== 'string') {
    return { detected: false, patterns: [], confidence: 0 };
  }

  const detectedPatterns: string[] = [];
  
  // Check each pattern
  SQL_INJECTION_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      detectedPatterns.push(`Pattern_${index + 1}: ${pattern.source.substring(0, 50)}`);
    }
  });

  // Calculate confidence based on number of patterns matched
  const confidence = Math.min(detectedPatterns.length * 0.25, 1.0);
  
  // Bonus for multiple patterns or dangerous keywords
  const dangerousKeywords = ['DROP', 'DELETE', 'EXEC', 'xp_cmdshell', 'UNION SELECT'];
  const hasDangerousKeyword = dangerousKeywords.some(keyword => 
    input.toUpperCase().includes(keyword)
  );
  
  const finalConfidence = hasDangerousKeyword 
    ? Math.min(confidence + 0.3, 1.0) 
    : confidence;

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    confidence: finalConfidence,
  };
}

/**
 * Calculate severity based on confidence and patterns
 */
function calculateSeverity(confidence: number, patterns: string[]): number {
  // Base severity on confidence
  let severity = Math.round(confidence * 10);
  
  // High severity for dangerous keywords
  const dangerousPatterns = patterns.filter(p => 
    p.includes('DROP') || 
    p.includes('DELETE') || 
    p.includes('EXEC') ||
    p.includes('xp_cmdshell')
  );
  
  if (dangerousPatterns.length > 0) {
    severity = Math.max(severity, 9); // Critical severity
  }
  
  // Medium-high severity for UNION attacks
  if (patterns.some(p => p.includes('UNION'))) {
    severity = Math.max(severity, 7);
  }
  
  return Math.min(severity, 10); // Cap at 10
}

// ============================================================================
// GEO-LOCATION RESOLVER
// ============================================================================

/**
 * Resolves IP address to geo-location
 */
async function resolveGeoLocation(ip: string): Promise<{
  city: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
}> {
  const empty = { city: null, country: null, latitude: null, longitude: null };

  // Skip localhost and private IPs
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1' || 
      ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return empty;
  }

  try {
    const res1 = await fetch(`https://ipapi.co/${ip}/json/`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res1.ok) {
      const d = await res1.json();
      if (d.latitude && d.longitude) {
        return { 
          city: d.city ?? null, 
          country: d.country_name ?? null, 
          latitude: String(d.latitude), 
          longitude: String(d.longitude) 
        };
      }
    }
  } catch { /* fall through */ }

  try {
    const res2 = await fetch(`http://ip-api.com/json/${ip}`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res2.ok) {
      const d = await res2.json();
      if (d.status === 'success' && d.lat && d.lon) {
        return { 
          city: d.city ?? null, 
          country: d.country ?? null, 
          latitude: String(d.lat), 
          longitude: String(d.lon) 
        };
      }
    }
  } catch { /* ignore */ }

  return empty;
}

/**
 * Extract client IP from request headers
 */
function getClientIP(): string {
  try {
    const headersList = headers();
    
    // Check various IP headers in order of preference
    const forwarded = headersList.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIp = headersList.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
    
    const cfIp = headersList.get('cf-connecting-ip');
    if (cfIp) {
      return cfIp.trim();
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Extract request metadata from headers
 */
function getRequestMetadata(): {
  userAgent: string;
  referer: string;
  method: string;
} {
  try {
    const headersList = headers();
    return {
      userAgent: headersList.get('user-agent') || 'unknown',
      referer: headersList.get('referer') || 'unknown',
      method: headersList.get('x-http-method') || 'POST',
    };
  } catch {
    return {
      userAgent: 'unknown',
      referer: 'unknown',
      method: 'unknown',
    };
  }
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log SQL injection attempt to database
 * This should be called before Zod validation to catch all attempts
 */
export async function logSQLInjectionAttempt(
  inputValue: string,
  inputSource: InputSource,
  additionalMetadata?: Record<string, any>
): Promise<void> {
  try {
    // Detect SQL injection patterns
    const detection = detectSQLInjection(inputValue);
    
    // Only log if patterns detected
    if (!detection.detected) {
      return;
    }

    // Get request metadata
    const ip = getClientIP();
    const metadata = getRequestMetadata();
    const geo = await resolveGeoLocation(ip);
    const severity = calculateSeverity(detection.confidence, detection.patterns);

    // Build detailed type description
    const typeDescription = [
      `SQL_INJECTION`,
      `source:${inputSource}`,
      `confidence:${Math.round(detection.confidence * 100)}%`,
      `patterns:${detection.patterns.length}`,
    ].join('|');

    // Log to database
    await db.insert(attackLogs).values({
      ip,
      severity,
      type: typeDescription,
      city: geo.city,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });

    // Detailed console logging
    console.log('🚨 [SQL INJECTION] Attack attempt detected and logged:', {
      timestamp: new Date().toISOString(),
      ip,
      inputSource,
      severity,
      confidence: `${Math.round(detection.confidence * 100)}%`,
      patternsDetected: detection.patterns.length,
      patterns: detection.patterns,
      inputPreview: inputValue.substring(0, 100) + (inputValue.length > 100 ? '...' : ''),
      userAgent: metadata.userAgent.substring(0, 100),
      referer: metadata.referer,
      location: geo.city && geo.country ? `${geo.city}, ${geo.country}` : 'Unknown',
      ...additionalMetadata,
    });

  } catch (error) {
    console.error('[SQL INJECTION LOGGER] Failed to log attack:', error);
    // Don't throw - logging failure shouldn't break the application
  }
}

/**
 * Validate and log input - returns whether input is safe
 * Use this as a pre-validation check before Zod schema validation
 */
export async function validateAndLogInput(
  inputValue: string,
  inputSource: InputSource,
  additionalMetadata?: Record<string, any>
): Promise<{
  isSafe: boolean;
  confidence: number;
  patterns: string[];
}> {
  const detection = detectSQLInjection(inputValue);
  
  // Log if detected
  if (detection.detected) {
    await logSQLInjectionAttempt(inputValue, inputSource, additionalMetadata);
  }
  
  return {
    isSafe: !detection.detected || detection.confidence < 0.3, // Low confidence = probably safe
    confidence: detection.confidence,
    patterns: detection.patterns,
  };
}

// ============================================================================
// BATCH VALIDATION FOR MULTIPLE INPUTS
// ============================================================================

/**
 * Validate multiple inputs at once (for forms with multiple fields)
 */
export async function validateMultipleInputs(
  inputs: Array<{
    value: string;
    source: InputSource;
  }>,
  additionalMetadata?: Record<string, any>
): Promise<{
  allSafe: boolean;
  results: Array<{
    source: InputSource;
    isSafe: boolean;
    confidence: number;
    patterns: string[];
  }>;
}> {
  const results = await Promise.all(
    inputs.map(async ({ value, source }) => {
      const detection = detectSQLInjection(value);
      
      if (detection.detected) {
        await logSQLInjectionAttempt(value, source, additionalMetadata);
      }
      
      return {
        source,
        isSafe: !detection.detected || detection.confidence < 0.3,
        confidence: detection.confidence,
        patterns: detection.patterns,
      };
    })
  );
  
  const allSafe = results.every(r => r.isSafe);
  
  return { allSafe, results };
}

// ============================================================================
// QUERY FUNCTIONS (For Dashboard & Reporting)
// ============================================================================

/**
 * Get SQL injection statistics
 */
export async function getSQLInjectionStats(): Promise<{
  total: number;
  bySource: Record<InputSource, number>;
  bySeverity: { critical: number; high: number; medium: number; low: number };
  last24Hours: number;
  last7Days: number;
}> {
  try {
    const allAttacks = await db.select().from(attackLogs);
    
    const sqlAttacks = allAttacks.filter((a: { type: string }) => 
      a.type.includes('SQL_INJECTION')
    );
    
    // Count by source
    const bySource: Record<string, number> = {};
    sqlAttacks.forEach((attack: { type: string }) => {
      const sourceMatch = attack.type.match(/source:(\w+)/);
      if (sourceMatch) {
        const source = sourceMatch[1];
        bySource[source] = (bySource[source] || 0) + 1;
      }
    });
    
    // Count by severity
    const bySeverity = {
      critical: sqlAttacks.filter((a: { severity: number }) => a.severity >= 9).length,
      high: sqlAttacks.filter((a: { severity: number }) => a.severity >= 7 && a.severity < 9).length,
      medium: sqlAttacks.filter((a: { severity: number }) => a.severity >= 4 && a.severity < 7).length,
      low: sqlAttacks.filter((a: { severity: number }) => a.severity < 4).length,
    };
    
    // Time-based counts
    const now = Date.now();
    const day24h = 24 * 60 * 60 * 1000;
    const day7 = 7 * day24h;
    
    const last24Hours = sqlAttacks.filter((a: { timestamp: Date | null }) => {
      if (!a.timestamp) return false;
      return (now - new Date(a.timestamp).getTime()) <= day24h;
    }).length;
    
    const last7Days = sqlAttacks.filter((a: { timestamp: Date | null }) => {
      if (!a.timestamp) return false;
      return (now - new Date(a.timestamp).getTime()) <= day7;
    }).length;
    
    return {
      total: sqlAttacks.length,
      bySource: bySource as Record<InputSource, number>,
      bySeverity,
      last24Hours,
      last7Days,
    };
  } catch (error) {
    console.error('[SQL INJECTION LOGGER] Failed to get stats:', error);
    return {
      total: 0,
      bySource: {} as Record<InputSource, number>,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      last24Hours: 0,
      last7Days: 0,
    };
  }
}

/**
 * Get recent SQL injection attempts
 */
export async function getRecentSQLInjections(limit: number = 20) {
  try {
    const allAttacks = await db.select().from(attackLogs);
    
    return allAttacks
      .filter((a: { type: string }) => a.type.includes('SQL_INJECTION'))
      .sort((a: { timestamp: Date | null }, b: { timestamp: Date | null }) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('[SQL INJECTION LOGGER] Failed to get recent attacks:', error);
    return [];
  }
}
