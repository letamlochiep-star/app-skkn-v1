import { describe, it, expect, beforeEach, vi } from "vitest";
import { EntitlementService } from "@/server/services/entitlement-service";
import { SubscriptionService } from "@/server/services/subscription-service";
import { UsageService } from "@/server/services/usage-service";

describe("Entitlement Engine Feature Gate Rules", () => {
  const userId = "test-user-trial";

  beforeEach(() => {
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should permit CREATE_PROJECT for an active Trial user", async () => {
    const result = await EntitlementService.checkEntitlement({
      userId,
      feature: "CREATE_PROJECT",
    });

    expect(result.allowed).toBe(true);
    expect(result.planCode).toBe("TRIAL");
  });

  it("should BLOCK EXPORT_DOCX for a Trial user", async () => {
    const result = await EntitlementService.checkEntitlement({
      userId,
      feature: "EXPORT_DOCX",
    });

    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("FEATURE_NOT_INCLUDED");
    expect(result.reason).toContain("chỉ có trong gói trả phí");
  });

  it("should BLOCK EXPORT_PPTX and DEFENSE_PRESENTATION for a Trial user", async () => {
    const resPptx = await EntitlementService.checkEntitlement({
      userId,
      feature: "EXPORT_PPTX",
    });
    expect(resPptx.allowed).toBe(false);
    expect(resPptx.errorCode).toBe("FEATURE_NOT_INCLUDED");

    const resDefense = await EntitlementService.checkEntitlement({
      userId,
      feature: "DEFENSE_PRESENTATION",
    });
    expect(resDefense.allowed).toBe(false);
    expect(resDefense.errorCode).toBe("FEATURE_NOT_INCLUDED");
  });

  it("should permit AI_REVIEW for Trial user", async () => {
    const result = await EntitlementService.checkEntitlement({
      userId,
      feature: "AI_REVIEW",
    });

    expect(result.allowed).toBe(true);
  });

  it("should BLOCK all protected actions when Trial is expired", async () => {
    // Mock expired subscription
    vi.spyOn(SubscriptionService, "getSubscriptionStatus").mockResolvedValue({
      hasSubscription: true,
      subscriptionId: "sub-expired",
      isActive: false,
      isExpired: true,
      planCode: "TRIAL",
      trialStatus: {
        isTrial: true,
        isActive: false,
        isExpired: true,
        startedAt: "2026-08-01T00:00:00.000Z",
        expiresAt: "2026-08-04T00:00:00.000Z",
        remainingMs: 0,
        remainingDays: 0,
        remainingHours: 0,
        formattedRemaining: "Hết hạn dùng thử",
      },
    });

    const result = await EntitlementService.checkEntitlement({
      userId,
      feature: "CREATE_PROJECT",
    });

    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("TRIAL_EXPIRED");
    expect(result.reason).toContain("Thời gian trải nghiệm 3 ngày đã kết thúc");
  });
});
