import { describe, it, expect, beforeEach } from "vitest";
import { DocumentAssemblyService } from "@/server/services/document-assembly-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";

describe("Writer Document Assembly (Phase 7)", () => {
  const userId = "teacher-assembly";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    StructureRepository.clearMemoryStructureStore();
    WriterRepository.clearMemoryWriterStore();
  });

  it("should assemble document draft and calculate placeholder summary correctly", async () => {
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
      id: "struct_assembly",
      projectId: project.id,
      version: 1,
      status: "LOCKED",
      source: "AI_PROPOSED",
      structureJson: [
        { id: "sec_1", order: 1, title: "Đặt vấn đề", purpose: "Lý do", required: true },
        { id: "sec_2", order: 2, title: "Thực trạng", purpose: "Khó khăn", required: true },
      ],
      dataVersion: 1,
      topicVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const writerRepo = new WriterRepository();
    await writerRepo.saveSection({
      id: "sec_1",
      projectId: project.id,
      promptNumber: 1,
      title: "Đặt vấn đề",
      content: "Nội dung phần 1 đầy đủ.",
      status: "APPROVED",
      source: "USER_EDITED",
      version: 1,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await writerRepo.saveSection({
      id: "sec_2",
      projectId: project.id,
      promptNumber: 2,
      title: "Thực trạng",
      content: "Nội dung phần 2 còn [CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN] và [CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN].",
      status: "DRAFT",
      source: "AI_GENERATED",
      version: 1,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const draft = await DocumentAssemblyService.assembleDraftDocument({
      projectId: project.id,
      userId,
    });

    expect(draft.plainText).toContain("BÁO CÁO KẾT QUẢ ĐỀ TÀI");
    expect(draft.plainText).toContain("=== ĐẶT VẤN ĐỀ ===");
    expect(draft.plainText).toContain("=== THỰC TRẠNG ===");
    expect(draft.placeholderSummary.realDataPlaceholders).toBe(1);
    expect(draft.placeholderSummary.evidencePlaceholders).toBe(1);
  });
});
