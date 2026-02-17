'use server';

import { db, attackLogs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

/**
 * Log client-side security events to the database
 * 
 * This function is called from the ClientSecurityProtection component
 * when security violations are detected (right-click, DevTools, etc.)
 * 
 * @param type - Type of security event (e.g., "RIGHT_CLICK", "DEVTOOLS_DETECTED")
 * @param metadata - Additional context about the event
 */
export async function logClientSecurityEvent(
  type: string,
  metadata?: Record<string, any>
) {
  try {
    // Get client IP from headers
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Determine severity based on event type
    let severity = 3; // Default: low severity (deterrent events)
    
    if (type === 'DEVTOOLS_DETECTED') {
      severity = 5; // Medium severity - indicates technical user
    } else if (type === 'COPY_ATTEMPT') {
      severity = 4; // Low-medium - attempting to steal content
    } else if (type === 'VIEW_SOURCE_ATTEMPT' || type === 'SAVE_PAGE_ATTEMPT') {
      severity = 5; // Medium - attempting to download/analyze code
    } else if (type === 'KEYBOARD_SHORTCUT_BLOCKED') {
      severity = 4; // Low-medium - attempting DevTools access
    } else if (type === 'RIGHT_CLICK_BLOCKED') {
      severity = 3; // Low - common user behavior
    }

    // 1. Insert attack log INSTANTLY (appears in dashboard within 2 seconds)
    const [insertedLog] = await db.insert(attackLogs).values({
      ip,
      severity,
      type: `CLIENT:${type}`,
      city: null,
      country: null,
      latitude: null,
      longitude: null,
    }).returning({ id: attackLogs.id });

    // 2. Fetch geo in background (don't await - fire and forget)
    if (insertedLog && ip !== "unknown" && !ip.startsWith("127.") && !ip.startsWith("::1")) {
      (async () => {
        try {
          const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.latitude && geo.longitude) {
              await db.update(attackLogs).set({
                city: geo.city,
                country: geo.country_name,
                latitude: String(geo.latitude),
                longitude: String(geo.longitude),
              }).where(eq(attackLogs.id, insertedLog.id));
            }
          }
        } catch { /* geo unavailable - attack already logged */ }
      })();
    }

    console.log(`[CLIENT_SECURITY] Logged: ${type} from ${ip} (severity: ${severity})`);
    
    return { success: true };
  } catch (error) {
    console.error('[CLIENT_SECURITY] Failed to log event:', error);
    // Don't throw - we don't want to break the user experience
    return { success: false, error: 'Failed to log security event' };
  }
}

/**
 * Get client IP address (for displaying in watermark or debugging)
 * This is a helper function that can be called from client components
 */
export async function getClientIp() {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    return forwardedFor?.split(',')[0] || realIp || 'unknown';
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return 'unknown';
  }
}
