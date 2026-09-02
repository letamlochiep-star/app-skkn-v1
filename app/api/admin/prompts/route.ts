import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const prompts = [
      { id: "p1", key: "topic-analysis", name: "AI Topic Analysis & Suggestion", version: 1, status: "ACTIVE", taskType: "ANALYSIS", updatedAt: new Date().toISOString() },
      { id: "p2", key: "smart-data-questions", name: "Smart Data Questions Generator", version: 2, status: "ACTIVE", taskType: "QUESTIONS", updatedAt: new Date().toISOString() },
      { id: "p3", key: "18-prompt-set", name: "18-Prompt SKKN Writer System", version: 1, status: "ACTIVE", taskType: "DRAFT", updatedAt: new Date().toISOString() },
      { id: "p4", key: "full-review", name: "AI Reviewer & Rubric Auditor", version: 1, status: "ACTIVE", taskType: "REVIEW", updatedAt: new Date().toISOString() },
      { id: "p5", key: "defense-presentation", name: "Defense Presentation & Mock Jury", version: 1, status: "ACTIVE", taskType: "DEFENSE", updatedAt: new Date().toISOString() },
    ];

    return NextResponse.json({ status: "ok", data: { prompts } });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_PROMPTS_ERROR", message: msg }, { status });
  }
}
