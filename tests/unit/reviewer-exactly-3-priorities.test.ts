import { describe, it, expect } from "vitest";
import { ReviewValidator } from "@/server/services/review-validator";
import type { FullReviewPayload } from "@/types/review";

describe("Reviewer Exactly 3 Priorities Validation (Phase 8)", () => {
  const basePayload: FullReviewPayload = {
    action: "review_full_document",
    summary: {
      overallAssessment: "Bài viết đạt yêu cầu cơ bản về cấu trúc sư phạm.",
      strengths: ["Cấu trúc rõ ràng", "Bám sát GDPT 2018"],
      mainRisks: ["Cần bổ sung số liệu thực tế"],
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
        problem: "Thiếu số liệu khảo sát đầu năm của học sinh lớp 8A.",
        whyItMatters: "Làm giảm tính thuyết phục của phần thực trạng.",
        recommendedChange: "Bổ sung bảng số liệu điểm số và tỷ lệ khảo sát ban đầu.",
        documentLocation: "Phần 2: Thực trạng",
        requiredEvidenceOrData: ["pre_survey_score"],
      },
      {
        priorityNumber: 2,
        problem: "Chưa phân tích rõ điều kiện áp dụng cho giáo viên bộ môn.",
        whyItMatters: "Ảnh hưởng đến khả năng nhân rộng giải pháp.",
        recommendedChange: "Bổ sung tiểu mục về thiết bị và học liệu cần thiết.",
        documentLocation: "Phần 3: Biện pháp thực hiện",
        requiredEvidenceOrData: [],
      },
      {
        priorityNumber: 3,
        problem: "Trích dẫn thông tư cần ghi rõ số hiệu ban hành.",
        whyItMatters: "Đảm bảo tính chính xác pháp lý sư phạm.",
        recommendedChange: "Cập nhật số hiệu Thông tư 32/2018/TT-BGDĐT.",
        documentLocation: "Phần 1: Đặt vấn đề",
        requiredEvidenceOrData: [],
      },
    ],
    warnings: [],
  };

  it("should PASS when exactly 3 priority revisions are provided", () => {
    const res = ReviewValidator.validateReview(basePayload);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it("should FAIL when 2 priority revisions are provided", () => {
    const payload = {
      ...basePayload,
      priorityRevisions: basePayload.priorityRevisions.slice(0, 2),
    };
    const res = ReviewValidator.validateReview(payload);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("EXACTLY_3_PRIORITIES_VIOLATION");
  });

  it("should FAIL when 4 priority revisions are provided", () => {
    const payload = {
      ...basePayload,
      priorityRevisions: [
        ...basePayload.priorityRevisions,
        {
          priorityNumber: 4,
          problem: "Vấn đề số 4 thêm vào",
          whyItMatters: "Tại sao quan trọng",
          recommendedChange: "Cách sửa",
          documentLocation: "Phần 4",
          requiredEvidenceOrData: [],
        },
      ],
    };
    const res = ReviewValidator.validateReview(payload);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("EXACTLY_3_PRIORITIES_VIOLATION");
  });
});
