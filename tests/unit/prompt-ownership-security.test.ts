import { describe, it, expect, beforeEach } from "vitest";
import { StructureService } from "@/server/services/structure-service";
import { PromptSetService } from "@/server/services/prompt-set-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";

describe("Structure & Prompt Ownership Security (Phase 6B)", () => {
  const userA = "teacher-owner-A";
  const userB = "teacher-owner-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    StructureRepository.clearMemoryStructureStore();
    PromptSetRepository.clearMemoryPromptStore();
  });

  it("should prevent User B from reading, locking, or editing User A's structure and prompt set", async () => {
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
      workflowStage: "STRUCTURE",
    });

    // User B attempts to get structure state of Project A
    await expect(
      StructureService.getStructureState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to save draft of Project A
    await expect(
      StructureService.saveStructureDraft({
        projectId: projectA.id,
        userId: userB,
        sections: [],
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to get prompt state of Project A
    await expect(
      PromptSetService.getPromptSetState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
