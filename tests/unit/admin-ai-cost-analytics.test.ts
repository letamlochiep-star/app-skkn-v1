import { describe, it, expect } from "vitest";
import { AdminService } from "@/server/services/admin-service";

describe("Admin AI Cost Analytics (Phase 11)", () => {
  it("should return AI breakdown with requests, tokens, and cost", async () => {
    const breakdown = await AdminService.getAICostAnalytics();
    expect(breakdown.length).toBeGreaterThan(0);
    expect(breakdown[0].provider).toBeDefined();
    expect(breakdown[0].model).toBeDefined();
    expect(breakdown[0].totalInputTokens).toBeGreaterThan(0);
    expect(breakdown[0].estimatedCostUsd).toBeGreaterThan(0);
  });
});
