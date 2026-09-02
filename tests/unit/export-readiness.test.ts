import { describe, it, expect, beforeEach } from "vitest";
import { ExportReadinessService } from "@/server/services/export-readiness-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Export Readiness Engine (Phase 10)", () => {
  const userId = "teacher-exp-ready";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
    DefenseRepository.clearMemoryDefenseStore();
    UsageService.clearMemoryLedger();
  });

  it("should BLOCK PPTX and ONE_PAGE_PDF for SKKN projects", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài SKKN Toán 8",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const pptxReadiness = await ExportReadinessService.getReadiness({
      projectId: project.id,
      userId,
      exportType: "DEFENSE_PPTX",
    });

    expect(pptxReadiness.allowed).toBe(false);
    expect(pptxReadiness.status).toBe("BLOCKED");
    expect(pptxReadiness.blockers[0]).toContain("chỉ áp dụng cho đề tài Giải pháp hữu ích");
  });

  it("should BLOCK FINAL DOCX if document draft has not completed review", async () => {
    const project = await ProjectService.createProject({
      userId: "teacher-exp-ready-2",
      payload: {
        documentType: "SOLUTION",
        workingTitle: "Giải pháp Đồ dùng dạy học",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const writerRepo = new WriterRepository();
    await writerRepo.saveDocumentDraft({
      id: "draft_1",
      projectId: project.id,
      version: 1,
      contentJson: [],
      plainText: "Nội dung giải pháp",
      status: "READY_FOR_REVIEW",
      placeholderSummary: { realDataPlaceholders: 0, evidencePlaceholders: 0, referencePlaceholders: 0 },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const docxReadiness = await ExportReadinessService.getReadiness({
      projectId: project.id,
      userId: "teacher-exp-ready-2",
      exportType: "DOCX",
      mode: "FINAL",
    });

    expect(docxReadiness.allowed).toBe(false);
    expect(docxReadiness.blockers).toContain("Bản thảo chưa hoàn thành bước rà soát AI Reviewer");
  });
});
