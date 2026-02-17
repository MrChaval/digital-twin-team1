/**
 * SQL Injection Pattern Detector
 * Pure TypeScript utilities for detecting SQL injection patterns
 * NO 'use server' - these are synchronous helper functions
 */

// ============================================================================
// SQL INJECTION PATTERN DETECTION
// ============================================================================

/**
 * Common SQL injection patterns to detect
 */
export const SQL_INJECTION_PATTERNS = [
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
 * 
 * This is a PURE FUNCTION - no side effects, no async operations
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
 * 
 * This is a PURE FUNCTION - no side effects
 */
export function calculateSeverity(confidence: number, patterns: string[]): number {
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
