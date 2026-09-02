import { describe, it, expect, beforeEach } from "vitest";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";

describe("Concurrent Quota Safety", () => {
  const userId = "teacher-concurrent-test";

  beforeEach(() => {
    UsageService.clearMemoryLedger();
  });

  it("should handle 10 concurrent quota checks reliably", async () => {
    const promises = Array.from({ length: 10 }).map((_, i) =>
      requireQuota({
        userId,
        feature: "AI_GENERATE",
        requestedAmount: 1,
        requestId: `req_concurrent_${i}`,
      })
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach((r) => {
      expect(r.allowed).toBe(true);
      expect(r.planCode).toBe("TRIAL");
    });
  });
});
