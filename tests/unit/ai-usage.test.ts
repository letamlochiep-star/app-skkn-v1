import { describe, it, expect, beforeEach } from "vitest";
import { recordAIRequest, getMemoryUsageLogs, clearMemoryUsageLogs } from "@/server/services/ai-usage-service";

describe("AI Usage Service (Logging & Cost Tracking)", () => {
  beforeEach(() => {
    clearMemoryUsageLogs();
  });

  it("should record AI request and calculate estimated cost", async () => {
    const record = await recordAIRequest({
      userId: "user-test-uuid",
      projectId: "proj-test-uuid",
      taskType: "DRAFT",
      provider: "openai",
      model: "gpt-4o",
      inputTokens: 1500,
      outputTokens: 800,
      status: "SUCCESS",
      latencyMs: 1200,
    });

    expect(record.id).toBeDefined();
    expect(record.estimatedCost).toBeGreaterThan(0);
    expect(record.status).toBe("SUCCESS");
    expect(record.latencyMs).toBe(1200);

    const logs = getMemoryUsageLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe(record.id);
  });

  it("should log failed AI requests with error code", async () => {
    const record = await recordAIRequest({
      taskType: "REVIEW",
      provider: "gemini",
      model: "gemini-1.5-pro",
      inputTokens: 0,
      outputTokens: 0,
      status: "FAILED",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });

    expect(record.status).toBe("FAILED");
    expect(record.errorCode).toBe("RATE_LIMIT_EXCEEDED");
  });
});
