import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";
import type { NextRequest } from "next/server";

export const aj = arcjet({
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

export async function protectRoute(req: NextRequest) {
  const decision = await aj.protect(req, { requested: 1 });
  
  return {
    isAllowed: !decision.isDenied(),
    isDenied: decision.isDenied(),
    isRateLimit: decision.isDenied() && decision.reason.isRateLimit(),
    reason: decision.reason,
    id: decision.id,
    reset: decision.reason.isRateLimit() ? decision.reason.reset : undefined,
  };
}
