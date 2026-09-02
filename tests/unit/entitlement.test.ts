import { describe, it, expect } from "vitest";
import { requireEntitlement } from "@/server/guards/require-entitlement";
import { calculateTrialStatus } from "@/server/services/trial-service";

describe("Entitlement & Feature Access Guardrails", () => {
  it("should allow feature access when user has an active 3-day trial", async () => {
    const result = await requireEntitlement("user-with-active-trial", "AI_DRAFT_GENERATE");
    expect(result.allowed).toBe(true);
    expect(result.featureKey).toBe("AI_DRAFT_GENERATE");
  });

  it("should block feature access when trial has expired", () => {
    const expiredSub = {
      id: "sub-1",
      userId: "user-expired",
      planCode: "FREE_TRIAL",
      status: "EXPIRED" as const,
      trialStartedAt: "2026-08-01T00:00:00.000Z",
      trialExpiresAt: "2026-08-04T00:00:00.000Z",
      startedAt: "2026-08-01T00:00:00.000Z",
      expiresAt: "2026-08-04T00:00:00.000Z",
      maxProjects: 3,
    };

    const status = calculateTrialStatus(expiredSub, new Date("2026-09-02T00:00:00.000Z"));
    expect(status.isActive).toBe(false);
    expect(status.isExpired).toBe(true);
  });

  it("should reject entitlement checks without user ID", async () => {
    await expect(requireEntitlement("", "AI_DRAFT_GENERATE")).rejects.toThrow(
      "UNAUTHORIZED: User ID required for entitlement check"
    );
  });
});
