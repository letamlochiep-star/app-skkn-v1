import { describe, it, expect, beforeEach } from "vitest";
import { DocumentAssemblyService } from "@/server/services/document-assembly-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";

describe("Writer Consistency Check (Phase 7)", () => {
  const userId = "teacher-consistency";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
  });

  it("should detect student count conflict between verified facts and assembled draft", async () => {
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

    const projectRepo = new ProjectRepository();
    await projectRepo.saveFacts(project.id, [
      { key: "experimental_student_count", valueJson: 40, sourceType: "USER_ENTERED", verified: true },
    ]);

    const writerRepo = new WriterRepository();
    await writerRepo.saveDocumentDraft({
      id: "draft_test_cons",
      projectId: project.id,
      version: 1,
      contentJson: [],
      plainText: "Khảo sát trên 45 học sinh lớp 8A cho thấy kết quả khả quan.",
      status: "DRAFT",
      placeholderSummary: { realDataPlaceholders: 0, evidencePlaceholders: 0, referencePlaceholders: 0 },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const check = await DocumentAssemblyService.checkDraftConsistency({
      projectId: project.id,
      userId,
    });

    expect(check.conflicts.length).toBeGreaterThan(0);
    expect(check.conflicts[0].type).toBe("STUDENT_COUNT_MISMATCH");
  });
});
