import { describe, it, expect } from "vitest";
import { PromptSetValidator } from "@/server/services/prompt-set-validator";
import type { ProjectPrompt } from "@/types/prompt";

describe("Exactly 18 Prompts Validation (Phase 6B)", () => {
  const createMockPrompts = (count: number): ProjectPrompt[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p_${i + 1}`,
      promptSetId: "pset_test",
      projectId: "proj_test",
      promptNumber: i + 1,
      title: `Prompt ${i + 1}`,
      purpose: `Purpose ${i + 1}`,
      promptText:
        i + 1 === 18
          ? "Đóng vai trò chuyên gia thẩm định SKKN Bộ GD&ĐT, hãy rà soát thực trạng, biện pháp và tài liệu tham khảo."
          : `Nội dung chi tiết câu lệnh số ${i + 1} phục vụ đề tài môn Toán lớp 8.`,
      requiredDataKeys: [],
      missingDataKeys: [],
      status: "READY",
      immutable: i + 1 === 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  it("should fail validation if prompt count is 17", () => {
    const prompts17 = createMockPrompts(17);
    const res = PromptSetValidator.validatePromptSet(prompts17);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Yêu cầu ĐÚNG 18 câu lệnh"))).toBe(true);
  });

  it("should fail validation if prompt count is 19", () => {
    const prompts19 = createMockPrompts(19);
    const res = PromptSetValidator.validatePromptSet(prompts19);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Yêu cầu ĐÚNG 18 câu lệnh"))).toBe(true);
  });

  it("should pass validation when prompt count is exactly 18 and numbers are 1..18", () => {
    const prompts18 = createMockPrompts(18);
    const res = PromptSetValidator.validatePromptSet(prompts18);
    expect(res.valid).toBe(true);
    expect(res.count).toBe(18);
    expect(res.errors.length).toBe(0);
  });
});
