import { describe, it, expect, beforeEach } from "vitest";
import { ReviewerService } from "@/server/services/reviewer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";

describe("Reviewer Ownership Security (Phase 8)", () => {
  const userA = "teacher-review-owner-A";
  const userB = "teacher-review-owner-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    ReviewerRepository.clearMemoryReviewStore();
  });

  it("should prevent User B from reading or running reviews on User A's project", async () => {
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên đề tài A",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    await expect(
      ReviewerService.getReviewState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    await expect(
      ReviewerService.runFullReview({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
