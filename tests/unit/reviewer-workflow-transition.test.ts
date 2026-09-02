import { describe, it, expect, beforeEach } from "vitest";
import { ReviewWorkflowService } from "@/server/services/review-workflow-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Reviewer Workflow Transition to FINALIZE (Phase 8)", () => {
  const userId = "teacher-rev-trans";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    ReviewerRepository.clearMemoryReviewStore();
    UsageService.clearMemoryLedger();
  });

  it("should BLOCK completion if unresolved BLOCKING findings exist", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên đề tài",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const projectRepo = new ProjectRepository();
    await projectRepo.update(project.id, userId, {
      title: "Đề tài thử nghiệm",
      workflowStage: "REVIEW",
    });

    const reviewRepo = new ReviewerRepository();
    const run = await reviewRepo.saveReviewRun({
      id: "run_block_test",
      projectId: project.id,
      documentVersion: 1,
      reviewVersion: 1,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
    });

    await reviewRepo.saveFinding({
      id: "f_block_1",
      reviewRunId: run.id,
      projectId: project.id,
      category: "DATA",
      severity: "BLOCKING",
      findingType: "MANDATORY_FIX",
      title: "Mâu thuẫn số liệu nghiêm trọng",
      description: "Cần giải quyết trước khi hoàn tất.",
      status: "OPEN", // Unresolved blocker
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(
      ReviewWorkflowService.completeReviewStage({
        projectId: project.id,
        userId,
        confirmed: true,
      })
    ).rejects.toThrow("REVIEW_NOT_READY");
  });

  it("should transition to FINALIZE (100%) atomically without charging AI quota when all blockers are resolved and confirmed", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên đề tài",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const projectRepo = new ProjectRepository();
    await projectRepo.update(project.id, userId, {
      title: "Đề tài thử nghiệm",
      workflowStage: "REVIEW",
    });

    const reviewRepo = new ReviewerRepository();
    const run = await reviewRepo.saveReviewRun({
      id: "run_clean_test",
      projectId: project.id,
      documentVersion: 1,
      reviewVersion: 1,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
    });

    await reviewRepo.saveFinding({
      id: "f_resolved_1",
      reviewRunId: run.id,
      projectId: project.id,
      category: "DATA",
      severity: "BLOCKING",
      findingType: "MANDATORY_FIX",
      title: "Lỗi đã sửa",
      description: "Đã sửa hoàn tất.",
      status: "RESOLVED", // Resolved blocker
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updated = await ReviewWorkflowService.completeReviewStage({
      projectId: project.id,
      userId,
      confirmed: true,
    });

    expect(updated.workflowStage).toBe("FINALIZE");
    expect(updated.progressPercent).toBe(100);

    // Verify AI quota was not charged for transition
    const aiUsage = await UsageService.getFeatureUsage(userId, "AI_REVIEW");
    expect(aiUsage).toBe(0);
  });
});
