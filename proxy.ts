import { db, attackLogs } from "./lib/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import arcjet, { 
  detectBot, 
  shield,
  tokenBucket 
} from "@arcjet/next";

// Helper function to get real client IP (not Vercel proxy IP)
function getRealClientIP(req: Request): string {
  // Try x-forwarded-for first (real client IP from Vercel)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, first IP is the real client
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to x-real-ip
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Last resort: use Arcjet's detected IP (might be proxy)
  return "unknown";
}

// Initialize Arcjet with security rules
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  // Shield against common attacks
  characteristics: ["ip.src"],
  rules: [
    // Shield protects against common attacks (SQL injection, XSS, etc.)
    shield({
      mode: "LIVE", // Change to "DRY_RUN" for testing
    }),
    // Detect and block automated bots - Allow search engines and preview services
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Allow Google, Bing, DuckDuckGo, etc.
        "CATEGORY:PREVIEW", // Allow Vercel, social media preview bots
      ],
    }),
    // Global rate limiting - balanced rate limit per IP
    // 🟢 STANDARD TIER (Current): 50 requests/10 seconds
    // Other available tiers (see docs/ARCJET_RATE_LIMITING_GUIDE.md):
    // 🔵 HIGH-CAPACITY TIER: 100 requests/10 seconds (2x - for API endpoints, authenticated users)
    // 🟡 STRICT TIER: 25 requests/10 seconds (0.5x - for auth, admin, sensitive operations)
    tokenBucket({
      mode: "LIVE",
      refillRate: 50, // 50 requests per 10 seconds (allows ~7-10 page refreshes)
      interval: 10, // 10 seconds
      capacity: 50, // Allow burst of 50 requests
    }),
  ],
});

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher(['/admin', '/resources(.*)', '/projects']);
// Define public UI preview routes
const isPublicUIRoute = createRouteMatcher(['/ui(.*)']);

// Helper function to extract real IP address from request
function getClientIp(req: Request): string {
  // Check common IP header sources (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }
  return "unknown";
}

export default clerkMiddleware(async (auth, req) => {
  // STRICT User-Agent validation - Block all non-browser requests
  const userAgent = req.headers.get("user-agent") || "";
  
  // List of verified search engines and preview services (case-insensitive)
  const allowedBots = [
    // Search Engines
    "googlebot",
    "bingbot",
    "duckduckbot",
    "slurp", // Yahoo
    "baiduspider", // Baidu
    "yandexbot", // Yandex
    // Preview/Social Media Crawlers
    "vercel",
    "vercelbot",
    "twitterbot",
    "facebookexternalhit",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "whatsapp",
    "telegrambot",
  ];
  
  // Check if it's an allowed bot (search engine or preview service)
  const isAllowedBot = allowedBots.some((bot) =>
    userAgent.toLowerCase().includes(bot)
  );

  // If it's an allowed bot, skip all User-Agent checks
  if (!isAllowedBot) {
    // Block if User-Agent is empty or missing
    if (!userAgent || userAgent.trim() === "") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Missing User-Agent header",
        },
        { status: 403 }
      );
    }

    // List of common automation tool signatures
    const blockedUserAgents = [
      "curl",
      "wget",
      "python-requests",
      "python-urllib",
      "java/",
      "go-http-client",
      "ruby",
      "perl",
      "php",
      "scrapy",
      "postman",
      "insomnia",
      "httpie",
      "axios",
      "node-fetch",
      "apache-httpclient",
      "okhttp",
      "libwww",
    ];

    // Block if user agent matches automation tools (case-insensitive)
    const isAutomationTool = blockedUserAgents.some((blocked) =>
      userAgent.toLowerCase().includes(blocked.toLowerCase())
    );

    if (isAutomationTool) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Automated requests are not allowed",
        },
        { status: 403 }
      );
    }

    // Whitelist approach: Only allow User-Agents that look like real browsers
    // Real browsers always include "Mozilla/" and one of the major browser indicators
    const hasModernBrowserSignature = 
      userAgent.includes("Mozilla/") && 
      (
        userAgent.includes("Chrome/") ||
        userAgent.includes("Safari/") ||
        userAgent.includes("Firefox/") ||
        userAgent.includes("Edg/") || // Edge
        userAgent.includes("OPR/") // Opera
      );

    // Block if it doesn't look like a real browser
    if (!hasModernBrowserSignature) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Invalid User-Agent",
        },
        { status: 403 }
      );
    }
  }

  // ============================================================================
  // SQL INJECTION DETECTION - High Priority Logging
  // ============================================================================
  // Check for specific SQL injection patterns in URL and headers
  const url = req.url;
  const userAgentHeader = req.headers.get("user-agent") || "";
  const refererHeader = req.headers.get("referer") || "";
  const allHeaders = [url, userAgentHeader, refererHeader].join(" ").toLowerCase();
  
  // Critical SQL injection patterns to detect and log
  const sqlInjectionPatterns = [
    { pattern: /admin'\s*(?:or|OR)\s*['"]?1['"]?\s*=\s*['"]?1/gi, type: "SQL_INJECTION:ADMIN_OR_BYPASS", severity: 10 },
    { pattern: /admin'\s*(?:or|OR)\s*1\s*=\s*1/gi, type: "SQL_INJECTION:ADMIN_OR_BYPASS", severity: 10 },
    { pattern: /'\s*(?:or|OR)\s*['"]?1['"]?\s*=\s*['"]?1/gi, type: "SQL_INJECTION:OR_BYPASS", severity: 9 },
    { pattern: /';?\s*(?:DROP|drop)\s+(?:TABLE|table)/gi, type: "SQL_INJECTION:DROP_TABLE", severity: 10 },
    { pattern: /';?\s*(?:DELETE|delete)\s+(?:FROM|from)/gi, type: "SQL_INJECTION:DELETE_ATTACK", severity: 9 },
    { pattern: /';?\s*(?:UNION|union)\s+(?:SELECT|select)/gi, type: "SQL_INJECTION:UNION_SELECT", severity: 9 },
    { pattern: /(?:--|\/\*|#|;--)/gi, type: "SQL_INJECTION:COMMENT_INJECTION", severity: 8 },
  ];

  let sqlInjectionDetected = false;
  let attackType = "SQL_INJECTION";
  let attackSeverity = 9;

  // Check all patterns
  for (const { pattern, type, severity } of sqlInjectionPatterns) {
    if (pattern.test(allHeaders) || pattern.test(url)) {
      sqlInjectionDetected = true;
      attackType = type;
      attackSeverity = severity;
      break; // Use first match (highest priority)
    }
  }

  // If SQL injection detected, log it with HIGH severity
  if (sqlInjectionDetected) {
    const realIP = getRealClientIP(req);
    
    try {
      // Log attack immediately with high severity
      const [insertedLog] = await db.insert(attackLogs).values({
        ip: realIP,
        severity: attackSeverity, // Severity 9-10 (HIGH/CRITICAL)
        type: attackType,
        city: null,
        country: null,
        latitude: null,
        longitude: null,
      }).returning({ id: attackLogs.id });

      // Fetch geo in background
      if (insertedLog && realIP !== "unknown" && !realIP.startsWith("127.") && !realIP.startsWith("::1")) {
        (async () => {
          try {
            const geoRes = await fetch(`https://ipapi.co/${realIP}/json/`, { signal: AbortSignal.timeout(3000) });
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
          } catch { /* geo unavailable */ }
        })();
      }
    } catch (err) {
      console.error("Failed to log SQL injection attack:", err);
    }

    // Block the request immediately
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "SQL injection attempt detected and logged",
      },
      { status: 403 }
    );
  }

  // Apply Arcjet security checks
  const decision = await aj.protect(req, {
    requested: 1, // Request 1 token per request
  });

  // Check if rate limited - log to database and return HTML error page
  if (decision.isDenied() && decision.reason.isRateLimit()) {
    // Get real client IP for accurate logging
    const realIP = getRealClientIP(req);
    
    // Log attack INSTANTLY, then fetch geo in background (best of both worlds)
    try {
      // 1. Insert attack log immediately (appears in dashboard within 2 seconds)
      const [insertedLog] = await db.insert(attackLogs).values({
        ip: realIP,
        severity: 6,
        type: "RATE_LIMIT",
        city: null,
        country: null,
        latitude: null,
        longitude: null,
      }).returning({ id: attackLogs.id });

      // 2. Fetch geo in background (don't await - fire and forget)
      if (insertedLog && realIP !== "unknown" && !realIP.startsWith("127.") && !realIP.startsWith("::1")) {
        (async () => {
          try {
            const geoRes = await fetch(`https://ipapi.co/${realIP}/json/`, { signal: AbortSignal.timeout(3000) });
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
    } catch (err) {
      console.error("Failed to log rate limit attack:", err);
    }

    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Too Many Requests</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }
        h1 {
            font-size: 42px;
            color: #2d3748;
            margin-bottom: 24px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        .error-message {
            color: #e53e3e;
            font-size: 18px;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .tracking-info {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
            text-align: left;
        }
        .tracking-label {
            font-size: 14px;
            color: #718096;
            font-weight: 500;
            margin-bottom: 8px;
        }
        .tracking-id {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #2d3748;
            word-break: break-all;
            background: white;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #cbd5e0;
        }
        .rate-limit-info {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .rate-limit-info p {
            color: #742a2a;
            font-size: 14px;
            margin: 4px 0;
        }
        .rate-limit-info strong {
            color: #9b2c2c;
        }
        .back-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
            cursor: pointer;
        }
        .back-button:hover {
            background: #5a67d8;
        }
        .shield-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="shield-icon">🛡️</div>
        <h1>Too Many Requests</h1>
        <p class="error-message">
            An error occurred. Please contact your System Administrator or try again later.
        </p>
        
        <div class="rate-limit-info">
            <p><strong>Rate Limit Exceeded</strong></p>
            <p>You have exceeded the maximum number of requests allowed.</p>
            <p>Please wait ${decision.reason.reset || 10} seconds before trying again.</p>
        </div>
        
        <div class="tracking-info">
            <div class="tracking-label">Tracking ID:</div>
            <div class="tracking-id">${decision.id}</div>
        </div>
        
        <a href="/" class="back-button" onclick="window.location.reload(); return false;">Try Again</a>
    </div>
</body>
</html>`,
      {
        status: 429,
        headers: {
          "Content-Type": "text/html",
          "Retry-After": String(decision.reason.reset || 10),
        },
      }
    );
  }

  // Log security events for other denials
  if (decision.isDenied()) {
    // Get real client IP for accurate logging
    const realIP = getRealClientIP(req);
    
    // Log attack INSTANTLY, then fetch geo in background
    try {
      // Extract meaningful type from decision.reason
      let type = 'SECURITY_BLOCK';
      if (decision.reason.isBot()) {
        type = 'BOT_DETECTED';
      } else if (decision.reason.isRateLimit()) {
        type = 'RATE_LIMIT';
      } else if (decision.reason.isShield && 'shieldTriggered' in decision.reason) {
        type = `SHIELD:${decision.reason.shieldTriggered}`;
      } else if (typeof decision.reason === 'object' && 'type' in decision.reason) {
        type = String(decision.reason.type);
      }
      
      // Default severity for all blocks is 5, but can be customized
      let severity = 5;
      if (decision.reason.isBot()) {
        severity = 3; // Lower severity for generic bots
      } else if (decision.reason.isRateLimit()) {
        severity = 6; // Higher severity for rate limit breaches
      } else if (type.includes("SQL")) {
        severity = 9; // High severity for SQL Injection
      } else if (type.includes("XSS")) {
        severity = 8; // High severity for XSS
      }
      
      // 1. Insert attack log immediately (real-time dashboard)
      const [insertedLog] = await db.insert(attackLogs).values({
        ip: realIP,
        severity,
        type,
        city: null,
        country: null,
        latitude: null,
        longitude: null,
      }).returning({ id: attackLogs.id });

      // 2. Fetch geo in background (don't await)
      if (insertedLog && realIP !== "unknown" && !realIP.startsWith("127.") && !realIP.startsWith("::1")) {
        (async () => {
          try {
            const geoRes = await fetch(`https://ipapi.co/${realIP}/json/`, { signal: AbortSignal.timeout(3000) });
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

      console.warn("Arcjet blocked request:", {
        reason: decision.reason,
        ip: realIP,
        path: req.nextUrl.pathname,
      });
    } catch (err) {
      console.error("Failed to log attack to database", err);
    }
    
    return NextResponse.json(
      { 
        error: "Forbidden", 
        message: "Request blocked by security policy" 
      },
      { status: 403 }
    );
  }

  // Skip auth for public UI routes
  if (isPublicUIRoute(req)) {
    return NextResponse.next();
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};