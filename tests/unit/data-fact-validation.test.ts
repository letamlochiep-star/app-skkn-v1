import { describe, it, expect } from "vitest";
import { ProjectFactRegistry } from "@/lib/data/project-fact-registry";

describe("Fact Validation Rules (Phase 6A)", () => {
  it("should validate experimental student count as positive integer", () => {
    expect(ProjectFactRegistry.validateFieldValue("experimental_student_count", 40).valid).toBe(true);
    expect(ProjectFactRegistry.validateFieldValue("experimental_student_count", -5).valid).toBe(false);
    expect(ProjectFactRegistry.validateFieldValue("experimental_student_count", "not-a-number").valid).toBe(false);
    expect(ProjectFactRegistry.validateFieldValue("experimental_student_count", 0).valid).toBe(false);
  });

  it("should enforce minimum length on problem description", () => {
    expect(ProjectFactRegistry.validateFieldValue("current_problem", "Ngắn").valid).toBe(false);
    expect(
      ProjectFactRegistry.validateFieldValue(
        "current_problem",
        "Học sinh gặp nhiều khó khăn khi giải các bài toán thực tế do thiếu kỹ năng mô hình hóa."
      ).valid
    ).toBe(true);
  });

  it("should reject unknown field keys not in registry", () => {
    expect(ProjectFactRegistry.validateFieldValue("unknown_arbitrary_key", "value").valid).toBe(false);
  });
});
