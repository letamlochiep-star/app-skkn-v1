import { describe, it, expect, beforeEach } from "vitest";
import { DataWorkflowService } from "@/server/services/data-workflow-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";

describe("Data Integrity & Fact Provenance (Phase 6A)", () => {
  const userId = "teacher-provenance";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
  });

  it("should record verified provenance for user entered facts and reject invalid keys", async () => {
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

    const repo = new ProjectRepository();
    await repo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      workflowStage: "DATA",
    });

    // Save valid user-entered fact
    await DataWorkflowService.saveFact({
      projectId: project.id,
      userId,
      fieldKey: "experimental_student_count",
      value: 42,
      sourceType: "USER_ENTERED",
      verificationStatus: "VERIFIED_BY_USER",
    });

    const state = await DataWorkflowService.getDataState({
      projectId: project.id,
      userId,
    });

    expect(state.facts["experimental_student_count"]).toBe(42);
    expect(state.factMetadata["experimental_student_count"].sourceType).toBe("USER_ENTERED");
    expect(state.factMetadata["experimental_student_count"].verificationStatus).toBe("VERIFIED_BY_USER");

    // Reject unknown key
    await expect(
      DataWorkflowService.saveFact({
        projectId: project.id,
        userId,
        fieldKey: "fake_fabricated_field",
        value: "fake",
      })
    ).rejects.toThrow("DATA_INVALID_INPUT");
  });
});
