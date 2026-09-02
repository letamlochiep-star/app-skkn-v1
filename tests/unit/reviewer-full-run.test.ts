import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewerService } from "@/server/services/reviewer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Reviewer Full Run (Phase 8)", () => {
  const userId = "teacher-reviewer-run";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should fail review if document draft is not in READY_FOR_REVIEW status", async () => {
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

    await expect(
      ReviewerService.runFullReview({
        projectId: project.id,
        userId,
      })
    ).rejects.toThrow("DOCUMENT_NOT_READY_FOR_REVIEW");
  });
});
