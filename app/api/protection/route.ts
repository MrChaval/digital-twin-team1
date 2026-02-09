import { NextRequest, NextResponse } from "next/server";
import { protectRoute } from "@/lib/arcjet";

// Use Node.js runtime instead of Edge to avoid 1 MB bundle limit
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const protection = await protectRoute(req);

  if (protection.isRateLimit) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Too Many Requests</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.container{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:40px;max-width:500px;text-align:center}h1{font-size:32px;color:#2d3748;margin:20px 0}p{color:#718096;margin:16px 0}.info{background:#f7fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin:16px 0;font-size:12px;word-break:break-all}a{display:inline-block;background:#667eea;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;margin-top:16px}</style></head><body><div class="container"><div style="font-size:48px">🛡️</div><h1>Too Many Requests</h1><p>Please wait ${protection.reset || 10}s before trying again.</p><div class="info">ID: ${protection.id}</div><a href="/">Go Home</a></div></body></html>`,
      {
        status: 429,
        headers: {
          "Content-Type": "text/html",
          "Retry-After": String(protection.reset || 10),
        },
      }
    );
  }

  if (protection.isDenied) {
    return NextResponse.json(
      { error: "Forbidden", message: "Request blocked by security policy" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, message: "Protected route accessed successfully" });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
