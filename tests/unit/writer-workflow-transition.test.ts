import { describe, it, expect, beforeEach } from "vitest";
import { WriterWorkflowService } from "@/server/services/writer-workflow-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Writer Workflow Transition to REVIEW (Phase 7)", () => {
  const userId = "teacher-writer-transition";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    StructureRepository.clearMemoryStructureStore();
    WriterRepository.clearMemoryWriterStore();
    UsageService.clearMemoryLedger();
  });

  it("should fail transition if user confirmation is missing", async () => {
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
      WriterWorkflowService.completeWriterStage({
        projectId: project.id,
        userId,
        confirmed: false,
      })
    ).rejects.toThrow("WRITER_CONFIRMATION_REQUIRED");
  });

  it("should transition to REVIEW stage (90%) atomically without charging AI quota when valid", async () => {
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
    await projectRepo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      structureLocked: true,
      workflowStage: "WRITE",
    });

    const structRepo = new StructureRepository();
    await structRepo.saveStructure({
      id: "struct_trans",
      projectId: project.id,
      version: 1,
      status: "LOCKED",
      source: "AI_PROPOSED",
      structureJson: [{ id: "s1", order: 1, title: "Mục 1", purpose: "P1", required: true }],
      dataVersion: 1,
      topicVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const writerRepo = new WriterRepository();
    // Create sections 1..18
    for (let i = 1; i <= 18; i++) {
      await writerRepo.saveSection({
        id: `sec_${i}`,
        projectId: project.id,
        promptNumber: i,
        title: `Tiêu đề phần ${i}`,
        content: `Nội dung hoàn chỉnh của phần số ${i}.`,
        status: "APPROVED",
        source: "AI_GENERATED",
        version: 1,
        dataVersion: 1,
        structureVersion: 1,
        promptSetVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const updated = await WriterWorkflowService.completeWriterStage({
      projectId: project.id,
      userId,
      confirmed: true,
    });

    expect(updated.workflowStage).toBe("REVIEW");
    expect(updated.progressPercent).toBe(90);

    // Verify no AI quota was charged for completion
    const aiUsage = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(aiUsage).toBe(0);
  });
});
