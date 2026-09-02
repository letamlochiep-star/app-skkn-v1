import { describe, it, expect, beforeEach } from "vitest";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";

describe("Reviewer Targeted Revision & Finding Resolution (Phase 8)", () => {
  const userId = "teacher-rev-res";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
  });

  it("should update finding status to RESOLVED when teacher accepts or resolves it", async () => {
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

    const reviewRepo = new ReviewerRepository();
    const run = await reviewRepo.saveReviewRun({
      id: "run_res_test",
      projectId: project.id,
      documentVersion: 1,
      reviewVersion: 1,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
    });

    const finding = await reviewRepo.saveFinding({
      id: "f_res_1",
      reviewRunId: run.id,
      projectId: project.id,
      category: "DATA",
      severity: "BLOCKING",
      findingType: "MANDATORY_FIX",
      title: "Mâu thuẫn sĩ số học sinh",
      description: "Sĩ số trong bài không khớp số liệu khảo sát.",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(finding.status).toBe("OPEN");

    const resolved = await reviewRepo.updateFindingStatus(finding.id, "RESOLVED");
    expect(resolved.status).toBe("RESOLVED");
  });
});
