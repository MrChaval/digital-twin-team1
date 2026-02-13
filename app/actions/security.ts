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

    // Fetch geolocation data (optional - can fail silently)
    let geoData = null;
    try {
      // For localhost/development, use mock coordinates for demonstration
      if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip === 'unknown') {
        // Rotate through different global locations for accurate map testing
        // Coordinates are verified to match Web Mercator projection
        const mockLocations = [
          // Philippines - YOUR LOCATION (will show in Southeast Asia)
          { city: 'Manila', country_name: 'Philippines', latitude: 14.5995, longitude: 120.9842 },
          { city: 'Cebu', country_name: 'Philippines', latitude: 10.3157, longitude: 123.8854 },
          
          // Other Asian locations
          { city: 'Tokyo', country_name: 'Japan', latitude: 35.6762, longitude: 139.6503 },
          { city: 'Singapore', country_name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
          { city: 'Seoul', country_name: 'South Korea', latitude: 37.5665, longitude: 126.9780 },
          
          // India - Multiple cities for coverage
          { city: 'Mumbai', country_name: 'India', latitude: 19.0760, longitude: 72.8777 },
          { city: 'Delhi', country_name: 'India', latitude: 28.6139, longitude: 77.2090 },
          { city: 'Bangalore', country_name: 'India', latitude: 12.9716, longitude: 77.5946 },
          
          // Australia - Multiple cities for coverage
          { city: 'Sydney', country_name: 'Australia', latitude: -33.8688, longitude: 151.2093 },
          { city: 'Melbourne', country_name: 'Australia', latitude: -37.8136, longitude: 144.9631 },
          { city: 'Perth', country_name: 'Australia', latitude: -31.9505, longitude: 115.8605 },
          
          // Americas
          { city: 'San Francisco', country_name: 'United States', latitude: 37.7749, longitude: -122.4194 },
          { city: 'São Paulo', country_name: 'Brazil', latitude: -23.5505, longitude: -46.6333 },
          
          // Europe & Middle East
          { city: 'London', country_name: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
          { city: 'Moscow', country_name: 'Russia', latitude: 55.7558, longitude: 37.6173 },
          { city: 'Cairo', country_name: 'Egypt', latitude: 30.0444, longitude: 31.2357 },
        ];
        const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        geoData = mockLocations[hash % mockLocations.length];
        console.log(`[GEO] 🎯 Mock location for localhost: ${geoData.city}, ${geoData.country_name}`);
        console.log(`[GEO] 📍 Coordinates: Lat ${geoData.latitude}°, Lng ${geoData.longitude}°`);
        console.log(`[GEO] 🗺️  Map position: X=${((geoData.longitude + 180) / 360 * 100).toFixed(1)}%, Y=${(1 - Math.log(Math.tan(Math.PI / 4 + geoData.latitude * Math.PI / 180 / 2)) / Math.PI * 50).toFixed(1)}%`);
      } else {
        // For real IPs, fetch actual geolocation from multiple services with fallback
        console.log(`[GEO] Fetching geolocation for real IP: ${ip}`);
        
        // Try ipapi.co first (free, accurate, no API key needed)
        try {
          const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
            signal: AbortSignal.timeout(3000),
          });
          if (geoResponse.ok) {
            const data = await geoResponse.json();
            if (data.latitude && data.longitude) {
              geoData = {
                city: data.city,
                country_name: data.country_name,
                latitude: data.latitude,
                longitude: data.longitude,
              };
              console.log(`[GEO] Success from ipapi.co: ${geoData.city}, ${geoData.country_name}`);
            }
          }
        } catch (apiError) {
          console.warn('[GEO] ipapi.co failed, trying fallback...', apiError);
          
          // Fallback to ip-api.com (free, no API key, 45 req/min limit)
          try {
            const fallbackResponse = await fetch(`http://ip-api.com/json/${ip}`, {
              signal: AbortSignal.timeout(3000),
            });
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              if (data.lat && data.lon && data.status === 'success') {
                geoData = {
                  city: data.city,
                  country_name: data.country,
                  latitude: data.lat,
                  longitude: data.lon,
                };
                console.log(`[GEO] Success from ip-api.com: ${geoData.city}, ${geoData.country_name}`);
              }
            }
          } catch (fallbackError) {
            console.warn('[GEO] All geolocation services failed', fallbackError);
          }
        }
      }
    } catch (geoError) {
      console.warn('[GEO] Failed to fetch geo data for client security event:', geoError);
    }

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
