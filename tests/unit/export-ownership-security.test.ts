import { describe, it, expect, beforeEach } from "vitest";
import { ExportService } from "@/server/services/export-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ExportRepository } from "@/server/repositories/export-repository";

describe("Export Ownership Security (Phase 10)", () => {
  const userA = "teacher-exp-owner-A";
  const userB = "teacher-exp-owner-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    ExportRepository.clearMemoryExportStore();
  });

  it("should prevent User B from accessing or downloading User A's export", async () => {
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài A",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    await expect(
      ExportService.getExportState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    await expect(
      ExportService.generateExport({
        projectId: projectA.id,
        userId: userB,
        exportType: "DOCX",
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
