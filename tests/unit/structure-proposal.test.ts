import { describe, it, expect, beforeEach, vi } from "vitest";
import { StructureService } from "@/server/services/structure-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";

describe("Structure Proposal & Adaptation (Phase 6B)", () => {
  const userId = "teacher-structure-prop";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    StructureRepository.clearMemoryStructureStore();
    vi.restoreAllMocks();
  });

  it("should fail proposal if topic is not locked yet", async () => {
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
      StructureService.proposeStructure({
        projectId: project.id,
        userId,
      })
    ).rejects.toThrow("TOPIC_NOT_LOCKED");
  });

  it("should validate structure coverage correctly", () => {
    const validSections = [
      { id: "sec_1", order: 1, title: "Phần I: Đặt vấn đề và lý do chọn đề tài", purpose: "Nêu lý do", required: true },
      { id: "sec_2", order: 2, title: "Phần II: Thực trạng và Cơ sở lý luận", purpose: "Khảo sát thực trạng", required: true },
      { id: "sec_3", order: 3, title: "Phần III: Các biện pháp và giải pháp sư phạm", purpose: "Biện pháp chi tiết", required: true },
      { id: "sec_4", order: 4, title: "Phần IV: Kết quả thực nghiệm và đánh giá hiệu quả", purpose: "Số liệu kết quả", required: true },
      { id: "sec_5", order: 5, title: "Phần V: Kết luận và Khuyến nghị", purpose: "Tổng kết", required: true },
    ];

    const val = StructureService.validateStructure(validSections);
    expect(val.valid).toBe(true);
    expect(val.errors.length).toBe(0);
    expect(val.coverage.topicCovered).toBe(true);
    expect(val.coverage.solutionCovered).toBe(true);
  });
});
