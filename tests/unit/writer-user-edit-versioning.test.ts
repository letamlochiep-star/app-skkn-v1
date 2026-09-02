import { describe, it, expect, beforeEach } from "vitest";
import { WriterService } from "@/server/services/writer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Writer User Edit & Version History (Phase 7)", () => {
  const userId = "teacher-writer-edit";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    PromptSetRepository.clearMemoryPromptStore();
    WriterRepository.clearMemoryWriterStore();
    UsageService.clearMemoryLedger();
  });

  it("should save manual user edits, increment versions, and preserve history without charging AI quota", async () => {
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
      id: "pset_test_edit",
      projectId: project.id,
      version: 1,
      status: "READY",
      promptCount: 18,
      dataVersion: 1,
      promptFrameworkVersion: "18-prompt-framework-v1",
      prompts: [
        {
          id: "p_1",
          promptSetId: "pset_test_edit",
          projectId: project.id,
          promptNumber: 1,
          title: "Đặt vấn đề",
          purpose: "Lý do",
          promptText: "Viết đặt vấn đề...",
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

    // Save initial edit (v1)
    const v1 = await WriterService.saveUserEdit({
      projectId: project.id,
      userId,
      promptNumber: 1,
      content: "Nội dung ban đầu của giáo viên.",
    });

    expect(v1.version).toBe(1);
    expect(v1.status).toBe("USER_EDITED");

    // Save second edit (v2)
    const v2 = await WriterService.saveUserEdit({
      projectId: project.id,
      userId,
      promptNumber: 1,
      content: "Nội dung đã được bổ sung thêm chi tiết thực tế.",
    });

    expect(v2.version).toBe(2);

    // Check version history
    const versions = await WriterService.getPromptVersions({
      projectId: project.id,
      userId,
      promptNumber: 1,
    });

    expect(versions.length).toBe(2);
    expect(versions[0].version).toBe(2);
    expect(versions[1].version).toBe(1);

    // Verify AI quota was not charged
    const aiUsage = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(aiUsage).toBe(0);
  });
});
