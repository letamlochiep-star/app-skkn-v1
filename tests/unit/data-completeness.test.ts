import { describe, it, expect } from "vitest";
import { DataCompletenessService } from "@/server/services/data-completeness-service";

describe("Data Completeness Engine (Phase 6A)", () => {
  it("should return INCOMPLETE when essential required fields are missing", () => {
    const facts = {
      school_name: "Trường THCS Lê Quý Đôn",
    };

    const res = DataCompletenessService.assessCompleteness(facts);
    expect(res.status).toBe("INCOMPLETE");
    expect(res.missingRequired.length).toBeGreaterThan(0);
  });

  it("should return READY_FOR_STRUCTURE when all required fields are complete and valid", () => {
    const completeFacts = {
      school_name: "Trường THCS Lê Quý Đôn",
      implementation_period: "09/2026 - 03/2027",
      target_group: "Học sinh lớp 8",
      experimental_class: "Lớp 8A",
      experimental_student_count: 40,
      has_comparison_group: false,
      current_problem: "Học sinh gặp khó khăn trong việc giải quyết các bài toán liên môn và thực tế.",
      observable_manifestations: "Học sinh thường lúng túng khi đọc đề bài có yếu tố đời sống.",
      main_causes: "Phương pháp dạy học truyền thống ít cơ hội cho học sinh vận dụng kiến thức trải nghiệm.",
      target_goals: "Nâng cao năng lực mô hình hóa toán học và tính chủ động giải toán thực tế.",
      proposed_interventions: "Xây dựng hệ thống bài toán gắn với đời sống và tổ chức dạy học theo nhóm dự án nhỏ.",
      evidence_types: "Bài kiểm tra định kỳ, phiếu khảo sát học sinh, sản phẩm dự án học tập.",
      evidence_status: "AVAILABLE",
    };

    const res = DataCompletenessService.assessCompleteness(completeFacts);
    expect(res.missingRequired.length).toBe(0);
    expect(res.status).toBe("READY_FOR_STRUCTURE");
  });
});
