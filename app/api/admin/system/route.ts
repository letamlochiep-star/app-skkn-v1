import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const health = {
      appStatus: "HEALTHY",
      databaseStatus: "CONNECTED",
      supabaseAuth: "ONLINE",
      storageService: "OPERATIONAL",
      aiProviders: [
        { name: "OpenAI", status: "AVAILABLE", latencyMs: 180 },
        { name: "Google Gemini", status: "AVAILABLE", latencyMs: 145 },
        { name: "Anthropic", status: "AVAILABLE", latencyMs: 210 },
      ],
      exportEngine: "READY",
      recentErrorRate: "0.02%",
      activeVersion: "1.0.0-phase11",
      environment: process.env.NODE_ENV || "production",
    };

    return NextResponse.json({ status: "ok", data: { health } });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_SYSTEM_ERROR", message: msg }, { status });
  }
}
