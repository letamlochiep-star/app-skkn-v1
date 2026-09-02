import { describe, it, expect } from "vitest";
import { PromptSetValidator } from "@/server/services/prompt-set-validator";
import type { ProjectPrompt } from "@/types/prompt";
import type { StructureSection } from "@/types/structure";

describe("Prompt Structure Coverage (Phase 6B)", () => {
  it("should map structure sections to prompt numbers", () => {
    const prompts18: ProjectPrompt[] = Array.from({ length: 18 }, (_, i) => ({
      id: `p_${i + 1}`,
      promptSetId: "pset_test",
      projectId: "proj_test",
      promptNumber: i + 1,
      title: `Prompt ${i + 1}`,
      purpose: `Purpose ${i + 1}`,
      promptText:
        i === 17
          ? "Đóng vai trò chuyên gia thẩm định SKKN Bộ GD&ĐT, hãy rà soát thực trạng, biện pháp và tài liệu tham khảo."
          : `Nội dung chi tiết câu lệnh số ${i + 1} phục vụ đề tài môn Toán lớp 8.`,
      requiredDataKeys: [],
      missingDataKeys: [],
      status: "READY",
      immutable: i === 17,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const sections: StructureSection[] = [
      { id: "sec_1", order: 1, title: "Đặt vấn đề", purpose: "Lý do", required: true },
      { id: "sec_2", order: 2, title: "Thực trạng", purpose: "Khó khăn", required: true },
      { id: "sec_3", order: 3, title: "Biện pháp", purpose: "Giải pháp", required: true },
    ];

    const res = PromptSetValidator.validatePromptSet(prompts18, sections);
    expect(res.valid).toBe(true);
    expect(res.structureCoverage["sec_1"]).toBeDefined();
    expect(res.structureCoverage["sec_2"]).toBeDefined();
    expect(res.structureCoverage["sec_3"]).toBeDefined();
  });
});
