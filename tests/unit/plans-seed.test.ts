import { describe, it, expect } from "vitest";
import { DEFAULT_PLANS } from "@/server/services/subscription-service";

describe("Plan System & Quota Configurations", () => {
  it("should have correct TRIAL plan baseline limits", () => {
    const trial = DEFAULT_PLANS.TRIAL;
    expect(trial.code).toBe("TRIAL");
    expect(trial.durationDays).toBe(3);
    expect(trial.maxProjects).toBe(1);
    expect(trial.maxAiRequests).toBe(30);
    expect(trial.maxAiTokens).toBe(100000);
    expect(trial.maxStorageMb).toBe(50);
    expect(trial.canExportDocx).toBe(false);
    expect(trial.canExportPdf).toBe(false);
    expect(trial.canExportPptx).toBe(false);
    expect(trial.canUseAiReview).toBe(true);
    expect(trial.canUseDefensePresentation).toBe(false);
  });

  it("should enable export and defense for paid plans", () => {
    const monthly = DEFAULT_PLANS.PERSONAL_MONTHLY;
    expect(monthly.canExportDocx).toBe(true);
    expect(monthly.canExportPdf).toBe(true);
    expect(monthly.canUseDefensePresentation).toBe(true);
    expect(monthly.maxProjects).toBe(5);

    const yearly = DEFAULT_PLANS.PERSONAL_YEARLY;
    expect(yearly.canExportDocx).toBe(true);
    expect(yearly.canExportPptx).toBe(true);
    expect(yearly.maxProjects).toBe(30);
  });
});
