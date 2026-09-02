import { describe, it, expect, beforeEach } from "vitest";
import { WriterService } from "@/server/services/writer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";

describe("Writer Section Approval (Phase 7)", () => {
  const userId = "teacher-writer-approve";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    PromptSetRepository.clearMemoryPromptStore();
    WriterRepository.clearMemoryWriterStore();
  });

  it("should approve section and record approved_at and approved_by timestamp", async () => {
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

    const writerRepo = new WriterRepository();
    await writerRepo.saveSection({
      id: "sec_1",
      projectId: project.id,
      promptNumber: 1,
      title: "Đặt vấn đề",
      content: "Nội dung phần đặt vấn đề môn Toán.",
      status: "DRAFT",
      source: "AI_GENERATED",
      version: 1,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const approved = await WriterService.approvePromptContent({
      projectId: project.id,
      userId,
      promptNumber: 1,
    });

    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedBy).toBe(userId);
    expect(approved.approvedAt).toBeDefined();
  });
});
