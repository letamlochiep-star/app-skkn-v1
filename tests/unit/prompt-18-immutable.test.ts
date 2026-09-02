import { describe, it, expect, beforeEach } from "vitest";
import { PromptSetService } from "@/server/services/prompt-set-service";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ProjectService } from "@/server/services/project-service";
import { PROMPT_18_STANDARD_TEXT } from "@/lib/ai/prompts/prompt-set-builder";

describe("Prompt 18 Immutability (Phase 6B)", () => {
  const userId = "teacher-p18-immutable";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    PromptSetRepository.clearMemoryPromptStore();
  });

  it("should prevent updating Prompt 18 and preserve standard synthesis text", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const promptRepo = new PromptSetRepository();
    const promptSetId = "pset_test_18";
    await promptRepo.savePromptSet({
      id: promptSetId,
      projectId: project.id,
      version: 1,
      status: "READY",
      promptCount: 18,
      dataVersion: 1,
      promptFrameworkVersion: "18-prompt-framework-v1",
      prompts: [
        {
          id: "p_1",
          promptSetId,
          projectId: project.id,
          promptNumber: 1,
          title: "Đặt vấn đề",
          purpose: "Lý do",
          promptText: "Viết phần đặt vấn đề...",
          requiredDataKeys: [],
          missingDataKeys: [],
          status: "READY",
          immutable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "p_18",
          promptSetId,
          projectId: project.id,
          promptNumber: 18,
          title: "Tổng hợp toàn văn",
          purpose: "Rà soát toàn bài",
          promptText: PROMPT_18_STANDARD_TEXT,
          requiredDataKeys: [],
          missingDataKeys: [],
          status: "READY",
          immutable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Successfully edit Prompt 1
    const updatedP1 = await PromptSetService.updatePrompt({
      projectId: project.id,
      userId,
      promptNumber: 1,
      promptText: "Nội dung câu lệnh 1 đã được giáo viên tùy chỉnh hợp lệ.",
    });
    expect(updatedP1.promptText).toContain("đã được giáo viên tùy chỉnh");

    // Attempting to edit Prompt 18 must throw
    await expect(
      PromptSetService.updatePrompt({
        projectId: project.id,
        userId,
        promptNumber: 18,
        promptText: "Sửa Prompt 18 trái phép",
      })
    ).rejects.toThrow("PROMPT_IMMUTABLE");
  });
});
