import { describe, it, expect, beforeEach } from "vitest";
import { ReviewerService } from "@/server/services/reviewer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";

describe("Reviewer Stale Detection (Phase 8)", () => {
  const userId = "teacher-stale-check";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
  });

  it("should detect review run as stale when document draft version is newer than review run document version", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên đề tài",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const writerRepo = new WriterRepository();
    await writerRepo.saveDocumentDraft({
      id: "draft_v2",
      projectId: project.id,
      version: 2, // Document is now version 2
      contentJson: [],
      plainText: "Nội dung bản thảo mới đã sửa đổi.",
      status: "READY_FOR_REVIEW",
      placeholderSummary: { realDataPlaceholders: 0, evidencePlaceholders: 0, referencePlaceholders: 0 },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const reviewRepo = new ReviewerRepository();
    await reviewRepo.saveReviewRun({
      id: "run_v1",
      projectId: project.id,
      documentDraftId: "draft_v1",
      documentVersion: 1, // Review was done on version 1
      reviewVersion: 1,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
    });

    const state = await ReviewerService.getReviewState({
      projectId: project.id,
      userId,
    });

    expect(state.isStale).toBe(true);
  });
});
