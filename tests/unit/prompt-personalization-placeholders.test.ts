import { describe, it, expect } from "vitest";
import { PromptSetValidator } from "@/server/services/prompt-set-validator";
import type { ProjectPrompt } from "@/types/prompt";

describe("Prompt Personalization & Placeholders (Phase 6B)", () => {
  it("should reject prompts containing fabricated class sizes not in verified facts", () => {
    const fakePrompts: ProjectPrompt[] = Array.from({ length: 18 }, (_, i) => ({
      id: `p_${i + 1}`,
      promptSetId: "pset_test",
      projectId: "proj_test",
      promptNumber: i + 1,
      title: `Prompt ${i + 1}`,
      purpose: `Purpose ${i + 1}`,
      promptText:
        i === 8
          ? "Phân tích số liệu thực nghiệm trên 45 học sinh lớp 8A..." // 45 is fabricated
          : i === 17
          ? "Đóng vai trò chuyên gia thẩm định SKKN Bộ GD&ĐT, hãy rà soát thực trạng, biện pháp và tài liệu tham khảo."
          : `Nội dung câu lệnh số ${i + 1} phục vụ đề tài môn Toán lớp 8.`,
      requiredDataKeys: [],
      missingDataKeys: [],
      status: "READY",
      immutable: i === 17,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const verifiedFacts = {
      experimental_student_count: 40, // verified fact is 40
    };

    const res = PromptSetValidator.validatePromptSet(fakePrompts, [], verifiedFacts);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Phát hiện số liệu sĩ số học sinh tự sinh"))).toBe(true);
  });
});
