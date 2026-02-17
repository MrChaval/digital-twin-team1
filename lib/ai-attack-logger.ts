/**
 * AI Attack Logging System
 * Integrates AI governance events with the existing attack_logs table
 * Part of Layer 3: AI Governance
 */

'use server';

import { db, attackLogs } from "@/lib/db";
import type { AISecurityEvent } from "@/lib/ai-security";

// ============================================================================
// AI ATTACK TYPE CONSTANTS
// ============================================================================

/**
 * AI-specific attack types to log alongside network attacks
 * (Internal use only - not exported because this is a 'use server' file)
 */
const AI_ATTACK_TYPES = {
  PROMPT_INJECTION: 'PROMPT_INJECTION',
  AI_OUTPUT_LEAK: 'AI_OUTPUT_LEAK',
  MCP_TOOL_DENIED: 'MCP_TOOL_DENIED',
} as const;

// ============================================================================
// SEVERITY MAPPING
// ============================================================================

/**
 * Maps AI security event severity to numeric scale (1-10)
 * Aligns with existing attack_logs severity system
 */
function mapSeverityToNumber(severity: 'low' | 'medium' | 'high' | 'critical'): number {
  const severityMap = {
    'low': 3,
    'medium': 5,
    'high': 7,
    'critical': 10,
  };
  return severityMap[severity];
}

// ============================================================================
// GEO-LOCATION RESOLVER
// ============================================================================

/**
 * Resolves IP address to geo-location using ipapi.co with ip-api.com fallback.
 * Returns null fields if resolution fails — does not throw.
 */
async function resolveGeoLocation(ip: string): Promise<{
  city: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
}> {
  const empty = { city: null, country: null, latitude: null, longitude: null };

  // Skip non-routable / placeholder IPs
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return empty;
  }

  try {
    // Primary: ipapi.co (free, no key, HTTPS)
    const res1 = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) });
    if (res1.ok) {
      const d = await res1.json();
      if (d.latitude && d.longitude) {
        return { city: d.city ?? null, country: d.country_name ?? null, latitude: String(d.latitude), longitude: String(d.longitude) };
      }
    }
  } catch { /* fall through */ }

  try {
    // Fallback: ip-api.com (free, HTTP, 45 req/min)
    const res2 = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(3000) });
    if (res2.ok) {
      const d = await res2.json();
      if (d.status === 'success' && d.lat && d.lon) {
        return { city: d.city ?? null, country: d.country ?? null, latitude: String(d.lat), longitude: String(d.lon) };
      }
    }
  } catch { /* ignore */ }

  return empty;
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Logs a prompt injection attack attempt to the database
 */
export async function logPromptInjection(
  userInput: string,
  detectedPatterns: string[],
  confidence: number,
  ipAddress: string = 'unknown'
): Promise<void> {
  try {
    const severity = 4; // Fixed severity for prompt injection and bot warnings
    const geo = await resolveGeoLocation(ipAddress);

    await db.insert(attackLogs).values({
      ip: ipAddress,
      severity,
      type: `${AI_ATTACK_TYPES.PROMPT_INJECTION} (confidence: ${Math.round(confidence * 100)}%)`,
      city: geo.city,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });

    console.log(`[AI SECURITY] Prompt injection detected and logged:`, {
      ip: ipAddress,
      confidence,
      patterns: detectedPatterns.length,
      input: userInput.substring(0, 50) + '...',
    });
  } catch (error) {
    console.error('[AI SECURITY] Failed to log prompt injection:', error);
    // Don't throw - logging failure shouldn't break the application
  }
}

/**
 * Logs an AI output leakage attempt (system prompt disclosure, etc.)
 */
export async function logOutputLeakage(
  aiResponse: string,
  redactedItems: string[],
  ipAddress: string = 'unknown'
): Promise<void> {
  try {
    const geo = await resolveGeoLocation(ipAddress);

    await db.insert(attackLogs).values({
      ip: ipAddress,
      severity: 8, // High severity - system information leak
      type: `${AI_ATTACK_TYPES.AI_OUTPUT_LEAK} (${redactedItems.length} items redacted)`,
      city: geo.city,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });

    console.log(`[AI SECURITY] Output leakage prevented and logged:`, {
      ip: ipAddress,
      redactedCount: redactedItems.length,
      response: aiResponse.substring(0, 50) + '...',
    });
  } catch (error) {
    console.error('[AI SECURITY] Failed to log output leakage:', error);
  }
}

/**
 * Logs an unauthorized MCP tool access attempt
 */
export async function logMCPToolDenied(
  toolName: string,
  reason: string,
  ipAddress: string = 'unknown'
): Promise<void> {
  try {
    const geo = await resolveGeoLocation(ipAddress);

    await db.insert(attackLogs).values({
      ip: ipAddress,
      severity: 6, // Medium-high severity
      type: `${AI_ATTACK_TYPES.MCP_TOOL_DENIED}: ${toolName}`,
      city: geo.city,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });

    console.log(`[AI SECURITY] MCP tool access denied and logged:`, {
      ip: ipAddress,
      toolName,
      reason,
    });
  } catch (error) {
    console.error('[AI SECURITY] Failed to log MCP tool denial:', error);
  }
}

/**
 * Generic AI security event logger
 * Use this for custom AI governance events
 */
export async function logAISecurityEvent(
  event: AISecurityEvent,
  ipAddress: string = 'unknown'
): Promise<void> {
  try {
    const severityNumber = mapSeverityToNumber(event.severity);
    
    let typeDescription = event.type.toUpperCase();
    if (event.detectedPatterns && event.detectedPatterns.length > 0) {
      typeDescription += ` (${event.detectedPatterns.length} patterns)`;
    }
    
    const geo = await resolveGeoLocation(ipAddress);

    await db.insert(attackLogs).values({
      ip: ipAddress,
      severity: severityNumber,
      type: typeDescription,
      city: geo.city,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });

    console.log(`[AI SECURITY] Event logged:`, {
      type: event.type,
      severity: event.severity,
      ip: ipAddress,
    });
  } catch (error) {
    console.error('[AI SECURITY] Failed to log AI security event:', error);
  }
}

// ============================================================================
// QUERY FUNCTIONS (For Dashboard)
// ============================================================================

/**
 * Get count of AI-specific attacks
 * Used for dashboard statistics
 */
export async function getAIAttackCount(): Promise<{
  promptInjection: number;
  outputLeak: number;
  toolDenied: number;
  total: number;
}> {
  try {
    const attacks = await db.select().from(attackLogs);
    
    const promptInjection = attacks.filter((a: { type: string }) => 
      a.type.includes('PROMPT_INJECTION')
    ).length;
    
    const outputLeak = attacks.filter((a: { type: string }) => 
      a.type.includes('AI_OUTPUT_LEAK')
    ).length;
    
    const toolDenied = attacks.filter((a: { type: string }) => 
      a.type.includes('MCP_TOOL_DENIED')
    ).length;
    
    return {
      promptInjection,
      outputLeak,
      toolDenied,
      total: promptInjection + outputLeak + toolDenied,
    };
  } catch (error) {
    console.error('[AI SECURITY] Failed to get AI attack count:', error);
    return { promptInjection: 0, outputLeak: 0, toolDenied: 0, total: 0 };
  }
}

/**
 * Get recent AI attacks for dashboard display
 */
export async function getRecentAIAttacks(limit: number = 10) {
  try {
    const attacks = await db.select().from(attackLogs);
    
    const aiAttacks = attacks
      .filter((a: { type: string }) => 
        a.type.includes('PROMPT_INJECTION') ||
        a.type.includes('AI_OUTPUT_LEAK') ||
        a.type.includes('MCP_TOOL_DENIED')
      )
      .sort((a: { timestamp: Date | null }, b: { timestamp: Date | null }) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA; // Newest first
      })
      .slice(0, limit);
    
    return aiAttacks;
  } catch (error) {
    console.error('[AI SECURITY] Failed to get recent AI attacks:', error);
    return [];
  }
}
