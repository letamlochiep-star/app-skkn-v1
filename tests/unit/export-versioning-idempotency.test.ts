import { describe, it, expect, beforeEach } from "vitest";
import { ExportService } from "@/server/services/export-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { ExportRepository } from "@/server/repositories/export-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Export Versioning, Idempotency & Re-download (Phase 10)", () => {
  const userId = "teacher-exp-version-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
    DefenseRepository.clearMemoryDefenseStore();
    ExportRepository.clearMemoryExportStore();
    UsageService.clearMemoryLedger();
  });

  it("should reuse artifact with same fingerprint and not duplicate jobs", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài SKKN Version Test",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const writerRepo = new WriterRepository();
    await writerRepo.saveDocumentDraft({
      id: "draft_v_1",
      projectId: project.id,
      version: 1,
      contentJson: [],
      plainText: "Nội dung bản thảo v1",
      status: "READY_FOR_REVIEW",
      placeholderSummary: { realDataPlaceholders: 0, evidencePlaceholders: 0, referencePlaceholders: 0 },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res1 = await ExportService.generateExport({
      projectId: project.id,
      userId,
      exportType: "DOCX",
      mode: "DRAFT",
      requestId: "req_idem_1",
    });

    const res2 = await ExportService.generateExport({
      projectId: project.id,
      userId,
      exportType: "DOCX",
      mode: "DRAFT",
      requestId: "req_idem_2",
    });

    // Should return same job & artifact due to fingerprint match
    expect(res1.job.id).toBe(res2.job.id);
    expect(res1.artifact.id).toBe(res2.artifact.id);

    // Record download
    const dl = await ExportService.recordDownload({
      projectId: project.id,
      userId,
      artifactId: res1.artifact.id,
    });

    expect(dl.artifactId).toBe(res1.artifact.id);
  });
});
