import { NextResponse } from "next/server";
import { DEFAULT_AI_CONFIG } from "@/lib/config/ai";

/**
 * AI Provider Configuration & Availability Health Check
 * GET /api/health/ai
 *
 * Checks provider readiness safely without executing billable prompts or leaking API keys.
 */
export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 5);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);

  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || "openai";
  const fallbackProvider = process.env.AI_FALLBACK_PROVIDER || "gemini";

  const isHealthy = hasOpenAI || hasGemini;

  return NextResponse.json({
    status: isHealthy ? "ok" : "degraded",
    providers: {
      openai: {
        configured: hasOpenAI,
        defaultModel: process.env.AI_DRAFT_MODEL || "gpt-4o",
      },
      gemini: {
        configured: hasGemini,
        defaultModel: "gemini-1.5-pro",
      },
    },
    routingStrategy: {
      primary: primaryProvider,
      fallback: fallbackProvider,
      supportedTasks: Object.keys(DEFAULT_AI_CONFIG),
    },
    timestamp: new Date().toISOString(),
  });
}
