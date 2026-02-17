'use server';

import { db, attackLogs } from '@/lib/db';
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

    // Skip geolocation for INSTANT real-time logging (teacher demo requirement)
    const geoData = null;

    // Log to database
    await db.insert(attackLogs).values({
      ip,
      severity,
      type: `CLIENT:${type}`,
      city: geoData?.city || null,
      country: geoData?.country_name || null,
      latitude: geoData?.latitude?.toString() || null,
      longitude: geoData?.longitude?.toString() || null,
    });

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
