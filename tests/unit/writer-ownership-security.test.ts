import { describe, it, expect, beforeEach } from "vitest";
import { WriterService } from "@/server/services/writer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";

describe("Writer Ownership Security (Phase 7)", () => {
  const userA = "teacher-writer-owner-A";
  const userB = "teacher-writer-owner-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
  });

  it("should prevent User B from reading, generating, or editing sections in User A's project", async () => {
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

    const projectRepo = new ProjectRepository();
    await projectRepo.update(projectA.id, userA, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      structureLocked: true,
      workflowStage: "WRITE",
    });

    // User B attempts to access Writer State of Project A
    await expect(
      WriterService.getWriterState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to save user edit in Project A
    await expect(
      WriterService.saveUserEdit({
        projectId: projectA.id,
        userId: userB,
        promptNumber: 1,
        content: "Nội dung bất hợp pháp",
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
