import { describe, it, expect, beforeEach } from "vitest";
import { DataWorkflowService } from "@/server/services/data-workflow-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";

describe("Data Ownership Security (Phase 6A)", () => {
  const userA = "teacher-data-owner-A";
  const userB = "teacher-data-owner-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
  });

  it("should prevent User B from reading or saving facts for User A's project", async () => {
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const repo = new ProjectRepository();
    await repo.update(projectA.id, userA, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      workflowStage: "DATA",
    });

    // User B attempts to read User A's data
    await expect(
      DataWorkflowService.getDataState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to save fact in User A's project
    await expect(
      DataWorkflowService.saveFact({
        projectId: projectA.id,
        userId: userB,
        fieldKey: "school_name",
        value: "Trường giả mạo",
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
