import { describe, it, expect, beforeEach } from "vitest";
import { UsageService } from "@/server/services/usage-service";

describe("Usage Ledger & Idempotency", () => {
  const userId = "teacher-idempotent-test";

  beforeEach(() => {
    UsageService.clearMemoryLedger();
  });

  it("should record usage and correctly increment feature usage", async () => {
    await UsageService.recordUsage({
      userId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 5,
    });

    const used = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(used).toBe(5);

    const remaining = await UsageService.getRemainingQuota(userId, "AI_GENERATE");
    expect(remaining).toBe(25); // 30 - 5
  });

  it("should NOT double-count usage when the same idempotency key is submitted twice (retry scenario)", async () => {
    const idempotencyKey = "req_unique_12345678";

    // First call
    const first = await UsageService.recordUsage({
      userId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey,
    });

    // Retry with identical idempotencyKey
    const second = await UsageService.recordUsage({
      userId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey,
    });

    expect(first.id).toBe(second.id);

    const totalUsed = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(totalUsed).toBe(1); // Not 2!
  });
});
