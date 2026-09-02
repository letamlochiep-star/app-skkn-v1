import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Project Ownership & Isolation Security", () => {
  const userA = "teacher-owner-A";
  const userB = "teacher-intruder-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should prevent User B from reading, modifying, archiving or deleting User A's project", async () => {
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài bí mật của Thầy A",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    // 1. User B cannot read Project A
    await expect(
      ProjectService.getProject({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // 2. User B cannot update Project A
    await expect(
      ProjectService.updateProject({
        projectId: projectA.id,
        userId: userB,
        payload: { workingTitle: "Tên bị sửa bởi B" },
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // 3. User B cannot archive Project A
    await expect(
      ProjectService.archiveProject({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // 4. User B cannot delete Project A
    await expect(
      ProjectService.softDeleteProject({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
