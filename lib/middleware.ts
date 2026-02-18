import arcjet, { shield, detectBot } from "@arcjet/next";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Arcjet: WAF shield + bot detection active on every request
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Block common web attacks (SQLi, XSS, path traversal, etc.)
    shield({ mode: "LIVE" }),
    // Block automated bots — allow search engines and preview crawlers
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
      ],
    }),
  ],
});

export default clerkMiddleware(async (auth, req) => {
  // Run Arcjet protection before any route handler
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: "Automated bot traffic is not permitted." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Access denied by security policy." },
      { status: 403 }
    );
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy — Clerk-compatible
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com",
    "font-src 'self'",
    "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "block-all-mixed-content",
    "upgrade-insecure-requests"
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};