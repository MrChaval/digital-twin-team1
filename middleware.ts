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
    // Detect and block automated bots - STRICT MODE
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Allow Google, Bing, DuckDuckGo, etc.
        // Removed CATEGORY:PREVIEW and CATEGORY:MONITOR for stricter filtering
      ],
      // Block all other automated requests including curl, wget, python-requests, etc.
      block: [
        "CATEGORY:AUTOMATED", // Block all automated tools
      ],
    }),
    // Global rate limiting - balanced for normal browsing with multiple assets per page
    tokenBucket({
      mode: "LIVE",
      refillRate: 100, // 100 requests per 10 seconds (allows ~10 page refreshes with all assets)
      interval: 10, // 10 seconds
      capacity: 100, // Allow burst of 100 requests
    }),
  ],
});

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher(['/admin', '/resources(.*)', '/projects']);
// Define public UI preview routes
const isPublicUIRoute = createRouteMatcher(['/ui(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Additional manual User-Agent check for common automation tools
  const userAgent = req.headers.get("user-agent") || "";
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
    "fetch",
    "bot",
    "crawler",
    "spider",
    "scraper",
  ];

  // Block if user agent matches automation tools (case-insensitive)
  const isAutomationTool = blockedUserAgents.some((blocked) =>
    userAgent.toLowerCase().includes(blocked.toLowerCase())
  );

  // Allow only if it looks like a real browser or a verified search engine
  const isLikelyBrowser = userAgent.includes("Mozilla") || userAgent.includes("Chrome") || userAgent.includes("Safari");
  const isSearchEngine = userAgent.includes("Googlebot") || userAgent.includes("Bingbot") || userAgent.includes("DuckDuckBot");

  if (isAutomationTool && !isSearchEngine) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Automated requests are not allowed",
      },
      { status: 403 }
    );
  }

  // Apply Arcjet security checks
  const decision = await aj.protect(req, {
    requested: 1, // Request 1 token per request
  });

  // Check if rate limited - return HTML error page
  if (decision.isDenied() && decision.reason.isRateLimit()) {
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
    console.warn("Arcjet blocked request:", {
      reason: decision.reason,
      ip: decision.ip,
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