import { NextResponse } from "next/server";

/**
 * Basic System Health Check Endpoint
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "0.1.0",
    service: "skkn-ai-foundation",
    timestamp: new Date().toISOString(),
  });
}
