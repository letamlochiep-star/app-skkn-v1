import { describe, it, expect, beforeEach } from "vitest";
import { StructureService } from "@/server/services/structure-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";

describe("Structure Editor & Atomic Lock (Phase 6B)", () => {
  const userId = "teacher-struct-lock";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    StructureRepository.clearMemoryStructureStore();
  });

  it("should allow editing draft sections and lock structure atomically upon user confirmation", async () => {
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
      workflowStage: "STRUCTURE",
    });

    const sections = [
      { id: "sec_1", order: 1, title: "Phần I: Đặt vấn đề", purpose: "Lý do", required: true },
      { id: "sec_2", order: 2, title: "Phần II: Thực trạng", purpose: "Khó khăn", required: true },
      { id: "sec_3", order: 3, title: "Phần III: Các biện pháp thực hiện", purpose: "3 biện pháp", required: true },
      { id: "sec_4", order: 4, title: "Phần IV: Kết quả thực nghiệm", purpose: "Số liệu", required: true },
    ];

    // Save draft
    const draft = await StructureService.saveStructureDraft({
      projectId: project.id,
      userId,
      sections,
    });

    expect(draft.status).toBe("USER_EDITED");
    expect(draft.structureJson.length).toBe(4);

    // Fail lock without confirmation
    await expect(
      StructureService.lockStructure({
        projectId: project.id,
        userId,
        structureId: draft.id,
        confirmed: false,
      })
    ).rejects.toThrow("STRUCTURE_CONFIRMATION_REQUIRED");

    // Successful atomic lock
    const locked = await StructureService.lockStructure({
      projectId: project.id,
      userId,
      structureId: draft.id,
      confirmed: true,
    });

    expect(locked.status).toBe("LOCKED");
    expect(locked.lockedBy).toBe(userId);

    const updatedProj = await projectRepo.findById(project.id, userId);
    expect(updatedProj?.structureLocked).toBe(true);
  });
});
