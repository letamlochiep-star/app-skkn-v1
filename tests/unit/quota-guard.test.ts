import { describe, it, expect, beforeEach } from "vitest";
import { requireQuota, QuotaExceededError } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";

describe("Server-Side Quota Guard Enforcement", () => {
  const userId = "test-teacher-uuid";

  beforeEach(() => {
    UsageService.clearMemoryLedger();
  });

  it("should allow AI request when 29 out of 30 are used", async () => {
    // Record 29 AI requests
    await UsageService.recordUsage({
      userId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 29,
    });

    const result = await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
    });

    expect(result.allowed).toBe(true);
    expect(result.quota?.used).toBe(29);
    expect(result.quota?.remaining).toBe(1);
  });

  it("should block AI request when quota reaches 30/30", async () => {
    // Record 30 AI requests
    await UsageService.recordUsage({
      userId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 30,
    });

    await expect(
      requireQuota({
        userId,
        feature: "AI_GENERATE",
        requestedAmount: 1,
      })
    ).rejects.toThrow(QuotaExceededError);

    try {
      await requireQuota({
        userId,
        feature: "AI_GENERATE",
        requestedAmount: 1,
      });
    } catch (err) {
      const qErr = err as QuotaExceededError;
      expect(qErr.errorCode).toBe("AI_REQUEST_QUOTA_EXCEEDED");
      expect(qErr.message).toContain("Bạn đã sử dụng hết số lượt AI (30/30)");
    }
  });

  it("should allow first project creation (0/1) but block second project (1/1)", async () => {
    // 0/1: allowed
    const firstCheck = await requireQuota({
      userId,
      feature: "CREATE_PROJECT",
      requestedAmount: 1,
    });
    expect(firstCheck.allowed).toBe(true);

    // Record creation of 1 project
    await UsageService.recordUsage({
      userId,
      feature: "CREATE_PROJECT",
      usageType: "PROJECT_CREATED",
      quantity: 1,
    });

    // 1/1: blocked
    await expect(
      requireQuota({
        userId,
        feature: "CREATE_PROJECT",
        requestedAmount: 1,
      })
    ).rejects.toThrow(QuotaExceededError);
  });
});
