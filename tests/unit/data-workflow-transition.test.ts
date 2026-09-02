import { describe, it, expect, beforeEach } from "vitest";
import { DataWorkflowService } from "@/server/services/data-workflow-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Data Workflow Transition (Phase 6A)", () => {
  const userId = "teacher-wf-transition";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
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

    const repo = new ProjectRepository();
    await repo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      workflowStage: "DATA",
    });

    await expect(
      DataWorkflowService.completeDataStage({
        projectId: project.id,
        userId,
        confirmed: false,
      })
    ).rejects.toThrow("DATA_CONFIRMATION_REQUIRED");
  });

  it("should fail transition if required data fields are incomplete", async () => {
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

    const repo = new ProjectRepository();
    await repo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      workflowStage: "DATA",
    });

    // Save only 1 fact
    await DataWorkflowService.saveFact({
      projectId: project.id,
      userId,
      fieldKey: "school_name",
      value: "Trường THCS Lê Quý Đôn",
    });

    await expect(
      DataWorkflowService.completeDataStage({
        projectId: project.id,
        userId,
        confirmed: true,
      })
    ).rejects.toThrow("DATA_INCOMPLETE");
  });

  it("should transition to STRUCTURE stage atomically without charging AI quota when all data is valid", async () => {
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

    const repo = new ProjectRepository();
    await repo.update(project.id, userId, {
      title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tế cho học sinh lớp 8",
      topicLocked: true,
      workflowStage: "DATA",
    });

    const completeFacts = [
      { fieldKey: "school_name", value: "Trường THCS Lê Quý Đôn" },
      { fieldKey: "implementation_period", value: "09/2026 - 03/2027" },
      { fieldKey: "target_group", value: "Học sinh lớp 8" },
      { fieldKey: "experimental_class", value: "Lớp 8A" },
      { fieldKey: "experimental_student_count", value: 40 },
      { fieldKey: "has_comparison_group", value: false },
      { fieldKey: "current_problem", value: "Học sinh gặp khó khăn trong việc giải quyết các bài toán liên môn và thực tế." },
      { fieldKey: "observable_manifestations", value: "Học sinh thường lúng túng khi đọc đề bài có yếu tố đời sống." },
      { fieldKey: "main_causes", value: "Phương pháp dạy học truyền thống ít cơ hội cho học sinh vận dụng kiến thức trải nghiệm." },
      { fieldKey: "target_goals", value: "Nâng cao năng lực mô hình hóa toán học và tính chủ động giải toán thực tế." },
      { fieldKey: "proposed_interventions", value: "Xây dựng hệ thống bài toán gắn với đời sống và tổ chức dạy học theo nhóm dự án nhỏ." },
      { fieldKey: "evidence_types", value: "Bài kiểm tra định kỳ, phiếu khảo sát học sinh, sản phẩm dự án học tập." },
      { fieldKey: "evidence_status", value: "AVAILABLE" },
    ];

    await DataWorkflowService.saveBatchFacts({
      projectId: project.id,
      userId,
      facts: completeFacts,
    });

    const updated = await DataWorkflowService.completeDataStage({
      projectId: project.id,
      userId,
      confirmed: true,
    });

    expect(updated.workflowStage).toBe("STRUCTURE");
    expect(updated.progressPercent).toBe(45);

    // Verify no AI quota was charged for completion
    const aiUsage = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(aiUsage).toBe(0);
  });
});
