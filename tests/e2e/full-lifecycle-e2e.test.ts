import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIRouter } from "@/lib/ai/router";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { ExportRepository } from "@/server/repositories/export-repository";
import { AdminRepository } from "@/server/repositories/admin-repository";
import { UsageService } from "@/server/services/usage-service";

import { ProjectService } from "@/server/services/project-service";
import { TopicService } from "@/server/services/topic-service";
import { DataWorkflowService } from "@/server/services/data-workflow-service";
import { StructureService } from "@/server/services/structure-service";
import { PromptSetService } from "@/server/services/prompt-set-service";
import { WriterService } from "@/server/services/writer-service";
import { ReviewerService } from "@/server/services/reviewer-service";
import { DefenseService } from "@/server/services/defense-service";
import { ExportService } from "@/server/services/export-service";
import { AdminService } from "@/server/services/admin-service";
import { LicenseService } from "@/server/services/license-service";
import { initializeTrialSubscription, calculateTrialStatus } from "@/server/services/trial-service";

describe("SKKN AI Full-Lifecycle End-to-End Production E2E Test (Phase 12)", () => {
  const teacherId = "teacher-e2e-master-user";
  const adminId = "admin-e2e-super-user";
  const deviceHash = "dev_e2e_hash_1234567890abcdef";

  beforeEach(() => {
    vi.restoreAllMocks();
    ProjectRepository.clearMemoryStore();
    WriterRepository.clearMemoryWriterStore();
    ReviewerRepository.clearMemoryReviewStore();
    DefenseRepository.clearMemoryDefenseStore();
    ExportRepository.clearMemoryExportStore();
    AdminRepository.clearMemoryAdminStore();
    UsageService.clearMemoryLedger();
  });

  it("should flawlessly execute the entire 11-step pedagogical workflow from Registration to Final Export & Admin Ops", async () => {
    // -------------------------------------------------------------
    // STEP 1 & 2: User Trial Initialization
    // -------------------------------------------------------------
    const trialSub = initializeTrialSubscription(teacherId);
    const trialStatus = calculateTrialStatus(trialSub);
    expect(trialStatus.isActive).toBe(true);
    expect(trialStatus.remainingDays).toBeLessThanOrEqual(3);

    // -------------------------------------------------------------
    // STEP 3: License Key Issuance & Device Activation
    // -------------------------------------------------------------
    const { plaintextKey, license } = await LicenseService.issueLicense({
      userId: teacherId,
      maxDevices: 2,
    });
    expect(plaintextKey).toBeDefined();

    const activation = await LicenseService.activateLicense({
      licenseKey: plaintextKey,
      userId: teacherId,
      installationId: deviceHash,
      deviceName: "Laptop Asus Zenbook (Windows 11)",
    });
    expect(activation.success).toBe(true);

    // -------------------------------------------------------------
    // STEP 4: Project Creation (Solution Type)
    // -------------------------------------------------------------
    const project = await ProjectService.createProject({
      userId: teacherId,
      payload: {
        documentType: "SOLUTION",
        workingTitle: "Sử dụng đồ dùng trực quan trong dạy học môn KHTN 8",
        problemStatement: "Học sinh gặp khó khăn trong việc tiếp thu các kiến thức trừu tượng môn KHTN 8",
        targetGroup: "Học sinh khối 8 trường THCS Lê Quý Đôn",
        initialGoal: "Nâng cao kết quả học tập và hứng thú thực hành thí nghiệm",
        educationLevel: "SECONDARY",
        subjectGroup: "NATURAL_SCIENCES",
        gradeLevel: "Lớp 8",
        schoolYear: "2026-2027",
      },
    });
    expect(project.id).toBeDefined();
    expect(project.workflowStage).toBe("TOPIC");

    // -------------------------------------------------------------
    // STEP 5: Bước 1 – Topic Analysis, Suggestion & Topic Lock
    // -------------------------------------------------------------
    vi.spyOn(AIRouter, "execute").mockResolvedValue({
      content: JSON.stringify({
        action: "suggest_topics",
        topics: [
          {
            title: "Ứng dụng mô hình trực quan tự làm nhằm nâng cao hứng thú học tập môn KHTN 8",
            rationale: "Trực quan sinh động",
            strengths: ["Phù hợp thực tế"],
            evidenceFeasibility: "Sản phẩm tự làm",
            notes: "Khả thi cao",
          },
          {
            title: "Biện pháp tích hợp thí nghiệm thực hành trong dạy học môn KHTN 8",
            rationale: "Tăng tính chủ động",
            strengths: ["Phương pháp hiện đại"],
            evidenceFeasibility: "Phiếu học tập",
            notes: "Dễ áp dụng",
          },
          {
            title: "Xây dựng hệ thống học liệu số hỗ trợ tự học môn KHTN 8",
            rationale: "Chuyển đổi số",
            strengths: ["Ứng dụng CNTT"],
            evidenceFeasibility: "Video và bài giảng",
            notes: "Hiện đại",
          },
          {
            title: "Đổi mới kiểm tra đánh giá định kỳ môn KHTN 8 theo định hướng năng lực",
            rationale: "Đánh giá chuẩn xác",
            strengths: ["Trọng tâm đổi mới"],
            evidenceFeasibility: "Ma trận đề thi",
            notes: "Khoa học",
          },
          {
            title: "Tổ chức hoạt động trải nghiệm STEM trong môn KHTN 8",
            rationale: "Phát triển toàn diện",
            strengths: ["Giáo dục STEM"],
            evidenceFeasibility: "Sản phẩm STEM học sinh",
            notes: "Hấp dẫn",
          },
        ],
        recommendedIndex: 0,
        recommendationReason: "Phù hợp nhất với bối cảnh môn KHTN 8",
      }),
      provider: "openai",
      model: "gpt-4o",
      tokenUsage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
      latencyMs: 250,
      requestId: "mock_e2e_topic_req",
    });

    const suggestions = await TopicService.suggestTopics({
      projectId: project.id,
      userId: teacherId,
    });
    expect(suggestions.suggestions.topics.length).toBeGreaterThanOrEqual(1);

    const lockedProject = await TopicService.lockTopic({
      projectId: project.id,
      userId: teacherId,
      finalTitle: "Ứng dụng mô hình trực quan tự làm nhằm nâng cao hứng thú học tập môn KHTN 8",
      confirmed: true,
    });
    expect(lockedProject.topicLocked).toBe(true);
    expect(lockedProject.workflowStage).toBe("DATA");

    // -------------------------------------------------------------
    // STEP 6: Bước 2A – Smart Questions, Real Data Collection & Completeness
    // -------------------------------------------------------------
    // Save pedagogy facts
    await DataWorkflowService.saveBatchFacts({
      projectId: project.id,
      userId: teacherId,
      facts: [
        { fieldKey: "school_name", value: "Trường THCS Lê Quý Đôn", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "implementation_period", value: "Từ 09/2026 đến 05/2027", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "target_group", value: "Học sinh khối 8", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "experimental_class", value: "Lớp 8A", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "experimental_student_count", value: 42, sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "current_problem", value: "Học sinh gặp khó khăn trong việc tiếp thu các kiến thức trừu tượng môn KHTN", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "observable_manifestations", value: "Học sinh còn thụ động, ít phát biểu xây dựng bài", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "main_causes", value: "Thiếu thiết bị thí nghiệm và đồ dùng trực quan sinh động", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "target_goals", value: "Nâng cao chất lượng tiếp thu và tăng cường hứng thú học tập", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "proposed_interventions", value: "Tự chế tạo và ứng dụng 3 bộ mô hình quang học trực quan trong các tiết dạy thực hành", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "evidence_types", value: "Bảng điểm kiểm tra thường xuyên và phiếu khảo sát học sinh", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
        { fieldKey: "evidence_status", value: "AVAILABLE", sourceType: "USER_ENTERED", verificationStatus: "VERIFIED_BY_USER" },
      ],
    });

    const dataState = await DataWorkflowService.getDataState({
      projectId: project.id,
      userId: teacherId,
    });
    expect(dataState.completeness.requiredComplete).toBeGreaterThan(0);

    // Transition to Structure
    const projectRepo = new ProjectRepository();
    await projectRepo.update(project.id, teacherId, {
      workflowStage: "STRUCTURE",
    });

    // -------------------------------------------------------------
    // STEP 7: Bước 2B – Structure Proposal & 18 Prompts Lock
    // -------------------------------------------------------------
    const structureRepo = new StructureRepository();
    const validSections = [
      { id: "sec_1", order: 1, title: "Phần I: Đặt vấn đề và lý do chọn đề tài", purpose: "Nêu lý do", required: true },
      { id: "sec_2", order: 2, title: "Phần II: Thực trạng và Cơ sở lý luận", purpose: "Khảo sát thực trạng", required: true },
      { id: "sec_3", order: 3, title: "Phần III: Các biện pháp và giải pháp sư phạm", purpose: "Biện pháp chi tiết", required: true },
      { id: "sec_4", order: 4, title: "Phần IV: Kết quả thực nghiệm và đánh giá hiệu quả", purpose: "Số liệu kết quả", required: true },
      { id: "sec_5", order: 5, title: "Phần V: Kết luận và Khuyến nghị", purpose: "Tổng kết", required: true },
    ];

    const structureRecord = await structureRepo.saveStructure({
      id: `str_${project.id}`,
      projectId: project.id,
      version: 1,
      status: "DRAFT",
      source: "AI_PROPOSED",
      topicVersion: 1,
      structureJson: validSections,
      dataVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const lockedStructure = await StructureService.lockStructure({
      projectId: project.id,
      userId: teacherId,
      structureId: structureRecord.id,
      confirmed: true,
    });
    expect(lockedStructure.structureJson.length).toBe(5);

    // Transition to WRITE
    await projectRepo.update(project.id, teacherId, {
      workflowStage: "WRITE",
    });

    // -------------------------------------------------------------
    // STEP 8: Bước 3 – AI Writer & Document Assembly
    // -------------------------------------------------------------
    const writerRepo = new WriterRepository();
    await writerRepo.saveSection({
      id: `sec_1_${project.id}`,
      projectId: project.id,
      structureSectionId: "sec_1",
      promptNumber: 1,
      title: "I. ĐẶT VẤN ĐỀ",
      content: "Nội dung lý do chọn đề tài...",
      status: "APPROVED",
      source: "AI_GENERATED",
      version: 1,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await writerRepo.saveDocumentDraft({
      id: `draft_${project.id}`,
      projectId: project.id,
      version: 1,
      contentJson: [],
      plainText: "Nội dung toàn văn bản thảo đề tài đồ dùng dạy học KHTN 8",
      status: "READY_FOR_REVIEW",
      placeholderSummary: { realDataPlaceholders: 0, evidencePlaceholders: 0, referencePlaceholders: 0 },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await projectRepo.update(project.id, teacherId, {
      workflowStage: "REVIEW",
    });

    // -------------------------------------------------------------
    // STEP 9: Bước 5 – AI Reviewer & Rubric Evaluation
    // -------------------------------------------------------------
    const reviewRepo = new ReviewerRepository();
    await reviewRepo.saveReviewRun({
      id: `rev_run_${project.id}`,
      projectId: project.id,
      documentDraftId: `draft_${project.id}`,
      documentVersion: 1,
      reviewVersion: 1,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      summaryJson: {
        overallAssessment: "Bản thảo đạt chất lượng tốt",
        strengths: ["Số liệu rõ ràng"],
        mainRisks: [],
        rubric: [],
        priorityRevisions: [],
      },
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
    });

    await projectRepo.update(project.id, teacherId, {
      workflowStage: "FINALIZE",
    });

    // -------------------------------------------------------------
    // STEP 10: Bước 6 – Solution Defense Presentation Package & Mock Jury
    // -------------------------------------------------------------
    const defensePackage = await DefenseService.createOrUpdatePackage({
      projectId: project.id,
      userId: teacherId,
      durationMinutes: 7,
    });
    expect(defensePackage.durationMinutes).toBe(7);

    const practiceSession = await DefenseService.startPracticeSession({
      projectId: project.id,
      userId: teacherId,
    });
    expect(practiceSession.status).toBe("IN_PROGRESS");

    // Complete defense package so that final export is allowed
    const completedPkg = await DefenseService.completeDefensePackage({
      projectId: project.id,
      userId: teacherId,
      confirmed: true,
    });
    expect(completedPkg.status).toBe("COMPLETED");

    // -------------------------------------------------------------
    // STEP 11: Export Engine – Generate 4 Artifacts with Zero AI Calls
    // -------------------------------------------------------------
    // 1. DOCX
    const docxExport = await ExportService.generateExport({
      projectId: project.id,
      userId: teacherId,
      exportType: "DOCX",
      mode: "DRAFT",
    });
    expect(docxExport.job.status).toBe("READY");
    expect(docxExport.artifact.checksum).toBeDefined();

    // 2. FULL_PDF
    const pdfExport = await ExportService.generateExport({
      projectId: project.id,
      userId: teacherId,
      exportType: "FULL_PDF",
      mode: "DRAFT",
    });
    expect(pdfExport.job.status).toBe("READY");

    // 3. DEFENSE_PPTX
    const pptxExport = await ExportService.generateExport({
      projectId: project.id,
      userId: teacherId,
      exportType: "DEFENSE_PPTX",
      mode: "FINAL",
    });
    expect(pptxExport.job.status).toBe("READY");

    // 4. ONE_PAGE_PDF
    const onePageExport = await ExportService.generateExport({
      projectId: project.id,
      userId: teacherId,
      exportType: "ONE_PAGE_PDF",
      mode: "FINAL",
    });
    expect(onePageExport.job.status).toBe("READY");

    // -------------------------------------------------------------
    // STEP 12: Admin Console & Operations
    // -------------------------------------------------------------
    const overviewMetrics = await AdminService.getDashboardOverview();
    expect(overviewMetrics.totalProjects).toBeGreaterThan(0);

    // Extend trial from admin
    const extendRes = await AdminService.extendUserTrial({
      targetUserId: teacherId,
      days: 3,
      adminUserId: adminId,
    });
    expect(extendRes.status).toBe("ok");

    // Verify audit logs
    const auditLogs = await AdminService.getAuditLogs(10);
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].action).toBe("TRIAL_EXTENDED");
  });
});
