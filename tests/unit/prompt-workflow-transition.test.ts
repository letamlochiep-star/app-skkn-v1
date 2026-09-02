import { describe, it, expect, beforeEach } from "vitest";
import { PromptSetService } from "@/server/services/prompt-set-service";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ProjectService } from "@/server/services/project-service";
import { UsageService } from "@/server/services/usage-service";

describe("Prompt Workflow Transition to WRITE (Phase 6B)", () => {
  const userId = "teacher-p-wf-transition";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    PromptSetRepository.clearMemoryPromptStore();
    UsageService.clearMemoryLedger();
  });

  it("should fail completion if user confirmation is missing", async () => {
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
      PromptSetService.completeStep2({
        projectId: project.id,
        userId,
        confirmed: false,
      })
    ).rejects.toThrow("STEP2_CONFIRMATION_REQUIRED");
  });

  it("should transition project to WRITE stage (70%) atomically without charging AI quota when confirmed", async () => {
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
      workflowStage: "STRUCTURE",
    });

    const promptRepo = new PromptSetRepository();
    const prompts = Array.from({ length: 18 }, (_, i) => ({
      id: `p_${i + 1}`,
      promptSetId: "pset_test_complete",
      projectId: project.id,
      promptNumber: i + 1,
      title: `Prompt ${i + 1}`,
      purpose: `Purpose ${i + 1}`,
      promptText: `Prompt text ${i + 1}`,
      requiredDataKeys: [],
      missingDataKeys: [],
      status: "READY" as const,
      immutable: i + 1 === 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await promptRepo.savePromptSet({
      id: "pset_test_complete",
      projectId: project.id,
      version: 1,
      status: "READY",
      promptCount: 18,
      dataVersion: 1,
      promptFrameworkVersion: "18-prompt-framework-v1",
      prompts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updated = await PromptSetService.completeStep2({
      projectId: project.id,
      userId,
      confirmed: true,
    });

    expect(updated.workflowStage).toBe("WRITE");
    expect(updated.progressPercent).toBe(70);

    // Verify no AI quota was charged for completion
    const aiUsage = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(aiUsage).toBe(0);
  });
});
