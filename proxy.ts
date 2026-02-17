import { db, attackLogs } from "./lib/db";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import arcjet, { 
  detectBot, 
  shield,
  tokenBucket 
} from "@arcjet/next";

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

  // Apply Arcjet security checks
  const decision = await aj.protect(req, {
    requested: 1, // Request 1 token per request
  });

  // Check if rate limited - log to database and return HTML error page
  if (decision.isDenied() && decision.reason.isRateLimit()) {
    // Log rate limit violation to database (don't await - fire and forget)
    (async () => {
      try {
        // Get the real IP address from request headers
        const attackIp = getClientIp(req);
        
        // Geo-lookup with fallback chain (ipapi.co → ip-api.com)
        let geoCity: string | null = null;
        let geoCountry: string | null = null;
        let geoLat: string | null = null;
        let geoLon: string | null = null;
        
        // Skip geolocation for unknown IPs or localhost
        if (attackIp !== "unknown" && !attackIp.startsWith("::1") && attackIp !== "127.0.0.1") {
          try {
            const r1 = await fetch(`https://ipapi.co/${attackIp}/json/`, { signal: AbortSignal.timeout(3000) });
            if (r1.ok) { 
              const d = await r1.json(); 
              if (d.latitude && d.longitude) { 
                geoCity = d.city; 
                geoCountry = d.country_name; 
                geoLat = String(d.latitude); 
                geoLon = String(d.longitude); 
              } 
            }
          } catch {
            try {
              const r2 = await fetch(`http://ip-api.com/json/${attackIp}`, { signal: AbortSignal.timeout(3000) });
              if (r2.ok) { 
                const d = await r2.json(); 
                if (d.status === 'success') { 
                  geoCity = d.city; 
                  geoCountry = d.country; 
                  geoLat = String(d.lat); 
                  geoLon = String(d.lon); 
                } 
              }
            } catch { /* geo unavailable */ }
          }
        }

        await db.insert(attackLogs).values({
          ip: attackIp,
          severity: 6, // Rate limit severity
          type: "RATE_LIMIT",
          city: geoCity,
          country: geoCountry,
          latitude: geoLat,
          longitude: geoLon,
        });
      } catch (err) {
        console.error("Failed to log rate limit attack:", err);
      }
    })();

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
    // We want to log the event to our database, but we don't want to block
    // the response to the user.
    const logPromise = (async () => {
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
        
        // Get the real IP address from request headers
        const blockIp = getClientIp(req);
        
        // Geo-lookup with fallback chain (ipapi.co → ip-api.com)
        let geoCity: string | null = null;
        let geoCountry: string | null = null;
        let geoLat: string | null = null;
        let geoLon: string | null = null;
        
        // Skip geolocation for unknown IPs or localhost
        if (blockIp !== "unknown" && !blockIp.startsWith("::1") && blockIp !== "127.0.0.1") {
          try {
            const r1 = await fetch(`https://ipapi.co/${blockIp}/json/`, { signal: AbortSignal.timeout(3000) });
            if (r1.ok) { 
              const d = await r1.json(); 
              if (d.latitude && d.longitude) { 
                geoCity = d.city; 
                geoCountry = d.country_name; 
                geoLat = String(d.latitude); 
                geoLon = String(d.longitude); 
              } 
            }
          } catch {
            try {
              const r2 = await fetch(`http://ip-api.com/json/${blockIp}`, { signal: AbortSignal.timeout(3000) });
              if (r2.ok) { 
                const d = await r2.json(); 
                if (d.status === 'success') { 
                  geoCity = d.city; 
                  geoCountry = d.country; 
                  geoLat = String(d.lat); 
                  geoLon = String(d.lon); 
                } 
              }
            } catch { /* geo unavailable */ }
          }
        }

        // Log the attack to the database
        await db.insert(attackLogs).values({
          ip: blockIp,
          severity,
          type,
          city: geoCity,
          country: geoCountry,
          latitude: geoLat,
          longitude: geoLon,
        });
      } catch (err) {
        console.error("Failed to log attack to database", err);
      }
    })();

    // We don't await the promise, but we can catch errors on it
    logPromise.catch(err => console.error("Error in logging promise:", err));

    console.warn("Arcjet blocked request:", {
      reason: decision.reason,
      ip: getClientIp(req),
      path: req.nextUrl.pathname,
    });
    
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