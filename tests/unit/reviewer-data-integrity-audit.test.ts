import { describe, it, expect } from "vitest";
import { ReviewValidator } from "@/server/services/review-validator";
import type { FullReviewPayload } from "@/types/review";

describe("Reviewer Data Integrity & Guardrail Audit (Phase 8)", () => {
  const basePayload: FullReviewPayload = {
    action: "review_full_document",
    summary: {
      overallAssessment: "Đạt chuẩn.",
      strengths: ["Tốt"],
      mainRisks: ["Cần kiểm tra"],
    },
    rubric: [
      { criterion: "Cấu trúc", assessment: "STRONG", strengths: "Tốt", issues: "Không", evidence: "Có", recommendation: "Giữ nguyên" },
      { criterion: "Tính cấp thiết", assessment: "ADEQUATE", strengths: "Tốt", issues: "Không", evidence: "Có", recommendation: "Giữ nguyên" },
      { criterion: "Cơ sở lý luận", assessment: "ADEQUATE", strengths: "Tốt", issues: "Không", evidence: "Có", recommendation: "Giữ nguyên" },
      { criterion: "Thực trạng", assessment: "ADEQUATE", strengths: "Tốt", issues: "Không", evidence: "Có", recommendation: "Giữ nguyên" },
      { criterion: "Giải pháp", assessment: "STRONG", strengths: "Tốt", issues: "Không", evidence: "Có", recommendation: "Giữ nguyên" },
    ],
    mandatoryFixes: [],
    qualityImprovements: [],
    keepAsIs: [],
    priorityRevisions: [
      {
        priorityNumber: 1,
        problem: "Vấn đề ưu tiên 1 cần khắc phục",
        whyItMatters: "Lý do quan trọng đối với đề tài",
        recommendedChange: "Hướng dẫn chỉnh sửa chi tiết",
        documentLocation: "Phần 1",
        requiredEvidenceOrData: [],
      },
      {
        priorityNumber: 2,
        problem: "Vấn đề ưu tiên 2 cần khắc phục",
        whyItMatters: "Lý do quan trọng đối với đề tài",
        recommendedChange: "Hướng dẫn chỉnh sửa chi tiết",
        documentLocation: "Phần 2",
        requiredEvidenceOrData: [],
      },
      {
        priorityNumber: 3,
        problem: "Vấn đề ưu tiên 3 cần khắc phục",
        whyItMatters: "Lý do quan trọng đối với đề tài",
        recommendedChange: "Hướng dẫn chỉnh sửa chi tiết",
        documentLocation: "Phần 3",
        requiredEvidenceOrData: [],
      },
    ],
    warnings: [],
  };

  it("should REJECT review if AI claims unsupported award prediction", () => {
    const payload: FullReviewPayload = {
      ...basePayload,
      summary: {
        ...basePayload.summary,
        overallAssessment: "Bài viết này có khả năng đạt giải 95% cấp tỉnh.",
      },
    };

    const res = ReviewValidator.validateReview(payload);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("UNSUPPORTED_AWARD_PREDICTION"))).toBe(true);
  });

  it("should REJECT review if AI makes unsupported AI detector claims", () => {
    const payload: FullReviewPayload = {
      ...basePayload,
      summary: {
        ...basePayload.summary,
        overallAssessment: "Đảm bảo AI detector = 0% và đạo văn 0%.",
      },
    };

    const res = ReviewValidator.validateReview(payload);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("UNSUPPORTED_AI_DETECTOR_CLAIM"))).toBe(true);
  });
});
