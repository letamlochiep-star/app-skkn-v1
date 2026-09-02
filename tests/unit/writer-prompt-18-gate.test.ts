import { describe, it, expect, beforeEach } from "vitest";
import { WriterService } from "@/server/services/writer-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";

describe("Writer Prompt 18 Prerequisite Gate (Phase 7)", () => {
  const userId = "teacher-p18-gate";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    PromptSetRepository.clearMemoryPromptStore();
    WriterRepository.clearMemoryWriterStore();
  });

  it("should fail Prompt 18 generation if preceding sections are not completed", async () => {
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

    // Attempting Prompt 18 when no preceding sections exist
    await expect(
      WriterService.generatePromptContent({
        projectId: project.id,
        userId,
        promptNumber: 18,
      })
    ).rejects.toThrow("PROMPT_18_PREREQUISITE_FAILED");
  });
});
