import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW", "CATEGORY:MONITOR"],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 15,
      interval: 10,
      capacity: 15,
    }),
  ],
});

const isProtectedRoute = createRouteMatcher(['/admin', '/resources(.*)', '/projects']);
const isPublicUIRoute = createRouteMatcher(['/ui(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const decision = await aj.protect(req, { requested: 1 });

  if (decision.isDenied() && decision.reason.isRateLimit()) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Too Many Requests</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.container{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:40px;max-width:500px;text-align:center}h1{font-size:32px;color:#2d3748;margin:20px 0}p{color:#718096;margin:16px 0}.info{background:#f7fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin:16px 0;font-size:12px;word-break:break-all}a{display:inline-block;background:#667eea;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;margin-top:16px}</style></head><body><div class="container"><div style="font-size:48px">🛡️</div><h1>Too Many Requests</h1><p>Please wait ${decision.reason.reset || 10}s before trying again.</p><div class="info">ID: ${decision.id}</div><a href="/">Go Home</a></div></body></html>`,
      {
        status: 429,
        headers: {
          "Content-Type": "text/html",
          "Retry-After": String(decision.reason.reset || 10),
        },
      }
    );
  }

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Forbidden", message: "Request blocked by security policy" },
      { status: 403 }
    );
  }

  if (isPublicUIRoute(req)) {
    return NextResponse.next();
  }
  
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};