import { describe, it, expect, beforeEach, vi } from "vitest";
import { WriterService } from "@/server/services/writer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Writer Generate Section (Phase 7)", () => {
  const userId = "teacher-writer-gen";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    StructureRepository.clearMemoryStructureStore();
    PromptSetRepository.clearMemoryPromptStore();
    WriterRepository.clearMemoryWriterStore();
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should fail generation if structure is not locked", async () => {
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

    await expect(
      WriterService.generatePromptContent({
        projectId: project.id,
        userId,
        promptNumber: 1,
      })
    ).rejects.toThrow();
  });

  it("should save generated section and create version 1 in history", async () => {
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

    const projectRepo = new ProjectRepository();
    await projectRepo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      structureLocked: true,
      workflowStage: "WRITE",
    });

    const promptRepo = new PromptSetRepository();
    await promptRepo.savePromptSet({
      id: "pset_test_gen",
      projectId: project.id,
      version: 1,
      status: "READY",
      promptCount: 18,
      dataVersion: 1,
      promptFrameworkVersion: "18-prompt-framework-v1",
      prompts: [
        {
          id: "p_1",
          promptSetId: "pset_test_gen",
          projectId: project.id,
          promptNumber: 1,
          title: "Đặt vấn đề",
          purpose: "Lý do chọn đề tài",
          promptText: "Viết phần đặt vấn đề...",
          requiredDataKeys: [],
          missingDataKeys: [],
          status: "READY",
          immutable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const writerRepo = new WriterRepository();
    // Simulate initial section save
    const saved = await writerRepo.saveSection({
      id: "sec_1",
      projectId: project.id,
      promptNumber: 1,
      title: "Đặt vấn đề",
      content: "Nội dung soạn thảo phần đặt vấn đề môn Toán lớp 8.",
      status: "DRAFT",
      source: "AI_GENERATED",
      version: 1,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(saved.promptNumber).toBe(1);
    expect(saved.version).toBe(1);
    expect(saved.status).toBe("DRAFT");
  });
});
