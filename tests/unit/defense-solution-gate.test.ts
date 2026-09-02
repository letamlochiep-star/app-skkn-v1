import { describe, it, expect, beforeEach } from "vitest";
import { DefenseService } from "@/server/services/defense-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Defense Solution Gate (Phase 9)", () => {
  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
    DefenseRepository.clearMemoryDefenseStore();
    UsageService.clearMemoryLedger();
  });

  it("should BLOCK defense presentation workspace for SKKN projects", async () => {
    const userId = "teacher-skkn-gate";
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN", // SKKN type
        workingTitle: "Tên đề tài SKKN",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    await expect(
      DefenseService.getDefenseState({
        projectId: project.id,
        userId,
      })
    ).rejects.toThrow("DEFENSE_PRESENTATION_NOT_ENABLED_FOR_DOCUMENT_TYPE");
  });

  it("should ALLOW defense presentation workspace for SOLUTION projects with ready review", async () => {
    const userId = "teacher-sol-gate-2";
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SOLUTION", // SOLUTION type
        workingTitle: "Giải pháp cải tiến quy trình đồ dùng dạy học",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const writerRepo = new WriterRepository();
    await writerRepo.saveDocumentDraft({
      id: "draft_sol_1",
      projectId: project.id,
      version: 1,
      contentJson: [],
      plainText: "Bản thảo giải pháp hữu ích.",
      status: "READY_FOR_REVIEW",
      placeholderSummary: { realDataPlaceholders: 0, evidencePlaceholders: 0, referencePlaceholders: 0 },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const state = await DefenseService.getDefenseState({
      projectId: project.id,
      userId,
    });

    expect(state.project.documentType).toBe("SOLUTION");
  });
});
