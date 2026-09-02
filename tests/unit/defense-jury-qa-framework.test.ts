import { describe, it, expect } from "vitest";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";

describe("Defense Jury Q&A and Answer Frameworks (Phase 9)", () => {
  it("should validate defense-jury-questions schema", () => {
    const payload = {
      action: "generate_jury_questions",
      questions: [
        { id: "q1", category: "METHOD", difficulty: "BASIC", question: "Giải pháp áp dụng cho đối tượng nào?", whyAsked: "Kiểm tra phạm vi" },
        { id: "q2", category: "NOVELTY", difficulty: "PROBING", question: "Điểm cải tiến cốt lõi so với trước đây là gì?", whyAsked: "Kiểm tra tính mới" },
        { id: "q3", category: "EVIDENCE", difficulty: "CHALLENGING", question: "Minh chứng nào chứng minh hiệu quả giảm thời gian?", whyAsked: "Kiểm tra số liệu" },
        { id: "q4", category: "FEASIBILITY", difficulty: "BASIC", question: "Kinh phí triển khai giải pháp là bao nhiêu?", whyAsked: "Kiểm tra chi phí" },
        { id: "q5", category: "SCALABILITY", difficulty: "PROBING", question: "Giải pháp có thể áp dụng cho môn học khác không?", whyAsked: "Kiểm tra nhân rộng" },
      ],
      warnings: [],
    };

    const val = validateAgainstSchema("defense-jury-questions", payload);
    expect(val.valid).toBe(true);
  });

  it("should validate defense-answer-frameworks schema", () => {
    const payload = {
      action: "generate_answer_framework",
      frameworks: [
        { questionId: "q1", directAnswer: "Giải pháp áp dụng cho...", supportingPoints: ["Ý 1"], limitations: ["Giới hạn 1"], avoidClaims: ["Không khẳng định"], closingLine: "Kết thúc" },
        { questionId: "q2", directAnswer: "Điểm cải tiến chính là...", supportingPoints: ["Ý 2"], limitations: ["Giới hạn 2"], avoidClaims: ["Không khẳng định"], closingLine: "Kết thúc" },
        { questionId: "q3", directAnswer: "Minh chứng dựa trên...", supportingPoints: ["Ý 3"], limitations: ["Giới hạn 3"], avoidClaims: ["Không khẳng định"], closingLine: "Kết thúc" },
        { questionId: "q4", directAnswer: "Kinh phí chủ yếu là...", supportingPoints: ["Ý 4"], limitations: ["Giới hạn 4"], avoidClaims: ["Không khẳng định"], closingLine: "Kết thúc" },
        { questionId: "q5", directAnswer: "Khả năng nhân rộng...", supportingPoints: ["Ý 5"], limitations: ["Giới hạn 5"], avoidClaims: ["Không khẳng định"], closingLine: "Kết thúc" },
      ],
      warnings: [],
    };

    const val = validateAgainstSchema("defense-answer-frameworks", payload);
    expect(val.valid).toBe(true);
  });
});
