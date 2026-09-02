import { describe, it, expect, beforeEach } from "vitest";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";

describe("Reviewer Evidence & Reference Audit (Phase 8)", () => {
  const userId = "teacher-evi-ref";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    ReviewerRepository.clearMemoryReviewStore();
  });

  it("should categorize evidence and reference findings correctly in findings store", async () => {
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
      id: "run_evi_test",
      projectId: project.id,
      documentVersion: 1,
      reviewVersion: 1,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
    });

    await reviewRepo.saveFinding({
      id: "f_evi_1",
      reviewRunId: run.id,
      projectId: project.id,
      category: "EVIDENCE",
      severity: "HIGH",
      findingType: "MANDATORY_FIX",
      title: "Thiếu minh chứng thực nghiệm",
      description: "Tuyên bố học sinh tiến bộ nhưng chưa có biên bản khảo sát.",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await reviewRepo.saveFinding({
      id: "f_ref_1",
      reviewRunId: run.id,
      projectId: project.id,
      category: "REFERENCE",
      severity: "MEDIUM",
      findingType: "QUALITY_IMPROVEMENT",
      title: "Nguồn trích dẫn chưa có năm ban hành",
      description: "Cần bổ sung năm ban hành của tài liệu tham khảo số 2.",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const findings = await reviewRepo.findFindingsByRun(run.id);
    expect(findings.length).toBe(2);
    expect(findings.find((f) => f.category === "EVIDENCE")?.severity).toBe("HIGH");
    expect(findings.find((f) => f.category === "REFERENCE")?.findingType).toBe("QUALITY_IMPROVEMENT");
  });
});
