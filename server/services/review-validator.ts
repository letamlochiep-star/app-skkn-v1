import type { FullReviewPayload } from "@/types/review";

export class ReviewValidator {
  /**
   * Validates business logic of full review payload
   */
  static validateReview(payload: FullReviewPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. EXACTLY 3 Priority Revisions
    if (!payload.priorityRevisions || payload.priorityRevisions.length !== 3) {
      errors.push(
        `EXACTLY_3_PRIORITIES_VIOLATION: Yêu cầu bắt buộc đúng 3 gợi ý chỉnh sửa ưu tiên, hiện có ${
          payload.priorityRevisions?.length || 0
        }`
      );
    } else {
      payload.priorityRevisions.forEach((p, idx) => {
        if (!p.problem || p.problem.trim().length < 5) {
          errors.push(`Priority ${idx + 1} thiếu nội dung mô tả vấn đề.`);
        }
        if (!p.whyItMatters || p.whyItMatters.trim().length < 5) {
          errors.push(`Priority ${idx + 1} thiếu phân tích vì sao quan trọng.`);
        }
        if (!p.recommendedChange || p.recommendedChange.trim().length < 5) {
          errors.push(`Priority ${idx + 1} thiếu hướng dẫn cách sửa.`);
        }
      });
    }

    // 2. No Fake Award Predictions or AI Detector claims
    const fullText = JSON.stringify(payload);
    if (/khả năng đạt giải\s*\d+%/i.test(fullText) || /chắc chắn đạt giải/i.test(fullText)) {
      errors.push("UNSUPPORTED_AWARD_PREDICTION: Không được phép đưa ra dự đoán giải thưởng.");
    }

    if (/AI detector/i.test(fullText) || /đạo văn 0%/i.test(fullText)) {
      errors.push("UNSUPPORTED_AI_DETECTOR_CLAIM: Không được phép cam kết tỷ lệ phát hiện AI.");
    }

    // 3. Rubric coverage (minimum 5 criteria assessed)
    if (!payload.rubric || payload.rubric.length < 5) {
      errors.push("RUBRIC_COVERAGE_INSUFFICIENT: Đánh giá rubric phải bao quát tối thiểu 5 tiêu chí.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
