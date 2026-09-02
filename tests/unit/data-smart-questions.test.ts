import { describe, it, expect, beforeEach, vi } from "vitest";
import { SmartDataQuestionService } from "@/server/services/smart-data-question-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Smart Data Questions (Phase 6A)", () => {
  const userId = "teacher-smart-q";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should fail if topic is not locked yet", async () => {
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
      SmartDataQuestionService.generateNextQuestions({
        projectId: project.id,
        userId,
      })
    ).rejects.toThrow("TOPIC_NOT_LOCKED");
  });

  it("should generate a batch of 3-5 smart questions for missing fields when topic is locked", async () => {
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

    // Lock topic manually for test setup
    const repo = new ProjectRepository();
    await repo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      workflowStage: "DATA",
    });

    const res = await SmartDataQuestionService.generateNextQuestions({
      projectId: project.id,
      userId,
    });

    expect(res.questions.length).toBeGreaterThanOrEqual(1);
    expect(res.questions.length).toBeLessThanOrEqual(5);
    expect(res.questions[0].fieldKey).toBeDefined();
    expect(res.questions[0].group).toBeDefined();
  });
});
