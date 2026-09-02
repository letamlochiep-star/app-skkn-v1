import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Project Lifecycle: Create, Update, Rename, Archive, Restore, Soft-Delete", () => {
  const userId = "teacher-lifecycle-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should transition through all lifecycle states correctly", async () => {
    // 1. Create
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên ban đầu",
        educationLevel: "HIGH_SCHOOL",
        subjectGroup: "LITERATURE",
        schoolYear: "2026-2027",
      },
    });
    expect(project.status).toBe("DRAFT");

    // 2. Rename
    const renamed = await ProjectService.renameProject({
      projectId: project.id,
      userId,
      newTitle: "Tên đã cập nhật mới",
    });
    expect(renamed.workingTitle).toBe("Tên đã cập nhật mới");

    // 3. Archive
    const archived = await ProjectService.archiveProject({
      projectId: project.id,
      userId,
    });
    expect(archived.status).toBe("ARCHIVED");
    expect(archived.archivedAt).toBeDefined();

    // 4. Restore
    const restored = await ProjectService.restoreProject({
      projectId: project.id,
      userId,
    });
    expect(restored.status).toBe("DRAFT");
    expect(restored.archivedAt).toBeNull();

    // 5. Soft Delete
    const deleted = await ProjectService.softDeleteProject({
      projectId: project.id,
      userId,
    });
    expect(deleted).toBe(true);

    // After soft delete, findById returns null
    await expect(
      ProjectService.getProject({ projectId: project.id, userId })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
