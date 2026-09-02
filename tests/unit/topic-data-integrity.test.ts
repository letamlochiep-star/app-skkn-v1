import { describe, it, expect } from "vitest";
import { AIDataIntegrityService } from "@/server/services/ai-data-integrity-service";
import type { TopicSuggestionsResult } from "@/types/topic";

describe("AI Data Integrity Validator (Phase 5)", () => {
  it("should REJECT AI output containing fabricated student numbers or class sizes", () => {
    const invalidOutput: TopicSuggestionsResult = {
      action: "suggest_topics",
      topics: [
        {
          title: "Biện pháp nâng cao chất lượng học tập cho 45 học sinh lớp 8",
          rationale: "Khảo sát thực tế sĩ số 45 em học sinh",
          strengths: ["Cụ thể"],
          evidenceFeasibility: "Khảo sát",
          notes: "Gợi ý",
        },
        { title: "Đề tài 2", rationale: "R2", strengths: [], evidenceFeasibility: "E2", notes: "N2" },
        { title: "Đề tài 3", rationale: "R3", strengths: [], evidenceFeasibility: "E3", notes: "N3" },
        { title: "Đề tài 4", rationale: "R4", strengths: [], evidenceFeasibility: "E4", notes: "N4" },
        { title: "Đề tài 5", rationale: "R5", strengths: [], evidenceFeasibility: "E5", notes: "N5" },
      ],
      recommendedIndex: 0,
      recommendationReason: "Lý do",
    };

    // knownFacts does not contain "45"
    const check = AIDataIntegrityService.validateTopicOutput(invalidOutput, {
      problemStatement: "Học sinh còn yếu hình học",
    });

    expect(check.pass).toBe(false);
    expect(check.violations.some((v) => v.includes("sĩ số/học sinh tự sinh"))).toBe(true);
  });

  it("should REJECT AI output containing forbidden absolute claims", () => {
    const invalidOutput: TopicSuggestionsResult = {
      action: "suggest_topics",
      topics: [
        {
          title: "Giải pháp tối ưu đảm bảo 100% đạt giải trong kỳ thi giáo viên giỏi",
          rationale: "R1",
          strengths: [],
          evidenceFeasibility: "E1",
          notes: "N1",
        },
        { title: "Đề tài 2", rationale: "R2", strengths: [], evidenceFeasibility: "E2", notes: "N2" },
        { title: "Đề tài 3", rationale: "R3", strengths: [], evidenceFeasibility: "E3", notes: "N3" },
        { title: "Đề tài 4", rationale: "R4", strengths: [], evidenceFeasibility: "E4", notes: "N4" },
        { title: "Đề tài 5", rationale: "R5", strengths: [], evidenceFeasibility: "E5", notes: "N5" },
      ],
      recommendedIndex: 0,
      recommendationReason: "Lý do",
    };

    const check = AIDataIntegrityService.validateTopicOutput(invalidOutput);
    expect(check.pass).toBe(false);
    expect(check.violations.some((v) => v.includes("khẳng định tuyệt đối"))).toBe(true);
  });
});
