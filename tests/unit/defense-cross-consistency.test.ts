import { describe, it, expect } from "vitest";
import { DefenseConsistencyService } from "@/server/services/defense-consistency-service";

describe("Defense Cross Consistency Audit (Phase 9)", () => {
  const verifiedFacts = {
    school_name: "Trường THCS Lê Quý Đôn",
    experimental_student_count: 40,
    school_year: "2026-2027",
  };

  it("should PASS when spoken script uses verified numbers", () => {
    const text = "Giải pháp được thử nghiệm trên 40 học sinh lớp 8A trường THCS Lê Quý Đôn.";
    const check = DefenseConsistencyService.checkNumericConsistency(text, verifiedFacts);
    expect(check.valid).toBe(true);
    expect(check.conflicts.length).toBe(0);
  });

  it("should DETECT and FLAG when spoken script or slide contains fabricated numbers", () => {
    const text = "Giải pháp được thử nghiệm trên 45 học sinh lớp 8A mang lại hiệu quả cao.";
    const check = DefenseConsistencyService.checkNumericConsistency(text, verifiedFacts);
    expect(check.valid).toBe(false);
    expect(check.conflicts[0]).toContain("Phát hiện số liệu tự sinh");
  });
});
