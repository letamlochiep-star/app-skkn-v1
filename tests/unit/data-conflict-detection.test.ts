import { describe, it, expect } from "vitest";
import { DataConsistencyService } from "@/server/services/data-consistency-service";

describe("Data Consistency & Conflict Detection (Phase 6A)", () => {
  it("should detect count mismatch between student count field and text description", () => {
    const facts = {
      experimental_student_count: 40,
      current_problem: "Khảo sát thực tế tại lớp có 45 học sinh cho thấy phần lớn các em gặp khó khăn.",
    };

    const conflicts = DataConsistencyService.detectConflicts(facts);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].type).toBe("COUNT_MISMATCH");
    expect(conflicts[0].message).toContain("Phát hiện mâu thuẫn sĩ số");
  });

  it("should flag blocking conflict if comparison group is enabled but details are missing", () => {
    const facts = {
      has_comparison_group: true,
      // comparison_class and comparison_student_count are missing
    };

    const conflicts = DataConsistencyService.detectConflicts(facts);
    expect(conflicts.some((c) => c.severity === "BLOCKING")).toBe(true);
  });
});
