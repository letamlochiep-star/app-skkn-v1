import { describe, it, expect, beforeEach } from "vitest";
import { ProjectFactRegistry } from "@/lib/data/project-fact-registry";

describe("Data Known & Missing Fields Detection (Phase 6A)", () => {
  it("should recognize known facts and identify remaining missing required fields", () => {
    const knownFacts: Record<string, unknown> = {
      school_name: "Trường THCS Lê Quý Đôn",
      implementation_period: "09/2026 - 03/2027",
      target_group: "Học sinh lớp 8",
      experimental_class: "Lớp 8A",
      experimental_student_count: 42,
    };

    const requiredFields = ProjectFactRegistry.getRequiredFields(knownFacts);

    const missing = requiredFields.filter((f) => {
      const val = knownFacts[f.key];
      return val === undefined || val === null || String(val).trim() === "";
    });

    expect(missing.some((m) => m.key === "school_name")).toBe(false);
    expect(missing.some((m) => m.key === "experimental_student_count")).toBe(false);
    expect(missing.some((m) => m.key === "current_problem")).toBe(true);
    expect(missing.some((m) => m.key === "proposed_interventions")).toBe(true);
  });

  it("should dynamically require comparison class only when has_comparison_group is true", () => {
    // Case 1: No comparison group
    const factsNoComp = { has_comparison_group: false };
    const reqNoComp = ProjectFactRegistry.getRequiredFields(factsNoComp);
    expect(reqNoComp.some((f) => f.key === "comparison_class")).toBe(false);

    // Case 2: Has comparison group
    const factsWithComp = { has_comparison_group: true };
    const reqWithComp = ProjectFactRegistry.getRequiredFields(factsWithComp);
    expect(reqWithComp.some((f) => f.key === "comparison_class")).toBe(true);
  });
});
