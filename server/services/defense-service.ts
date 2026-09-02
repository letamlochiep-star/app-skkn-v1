import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { DefenseContextBuilder } from "@/lib/ai/defense-context-builder";
import { DefensePromptBuilder } from "@/lib/ai/prompts/defense-prompt-builder";
import { DefenseConsistencyService } from "@/server/services/defense-consistency-service";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type {
  DefenseDuration,
  DefenseComponentType,
  ProjectDefensePackageRecord,
  ProjectDefenseComponentRecord,
  ProjectDefensePracticeSessionRecord,
  ProjectDefensePracticeTurnRecord,
} from "@/types/defense";

export class DefenseService {
  private static projectRepo = new ProjectRepository();
  private static writerRepo = new WriterRepository();
  private static reviewRepo = new ReviewerRepository();
  private static defenseRepo = new DefenseRepository();

  /**
   * Retrieves full state of Defense Presentation workspace
   */
  static async getDefenseState(params: { projectId: string; userId: string }) {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.documentType !== "SOLUTION") {
      throw new Error("DEFENSE_PRESENTATION_NOT_ENABLED_FOR_DOCUMENT_TYPE: Báo cáo bảo vệ chỉ dành cho đề tài Giải pháp hữu ích");
    }

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    const latestReview = await this.reviewRepo.findLatestReviewRun(projectId);
    const pkg = await this.defenseRepo.findLatestPackage(projectId);
    const components = pkg ? await this.defenseRepo.findComponentsByPackage(pkg.id) : [];

    const isStale = Boolean(
      pkg && draft && draft.version > pkg.sourceDocumentVersion
    );

    const practiceSession = await this.defenseRepo.findLatestPracticeSession(projectId);
    const practiceTurns = practiceSession ? await this.defenseRepo.findPracticeTurns(practiceSession.id) : [];

    return {
      project,
      draft,
      latestReview,
      package: pkg,
      isStale,
      components,
      practiceSession,
      practiceTurns,
    };
  }

  /**
   * Creates or initializes a defense package with specified duration
   */
  static async createOrUpdatePackage(params: {
    projectId: string;
    userId: string;
    durationMinutes: DefenseDuration;
    requestId?: string;
  }): Promise<ProjectDefensePackageRecord> {
    const { projectId, userId, durationMinutes, requestId } = params;

    if (![5, 7, 10].includes(durationMinutes)) {
      throw new Error(`INVALID_DURATION: Thời lượng ${durationMinutes} phút không hợp lệ (chỉ chấp nhận 5, 7 hoặc 10 phút)`);
    }

    const ctx = await DefenseContextBuilder.buildDefenseContext({ projectId, userId, durationMinutes });

    const existingPkg = await this.defenseRepo.findLatestPackage(projectId);
    const newVersion = (existingPkg?.version || 0) + 1;

    const pkgRecord: ProjectDefensePackageRecord = {
      id: existingPkg?.id || `def_pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      sourceDocumentId: ctx.draft.id,
      sourceDocumentVersion: ctx.draft.version,
      sourceReviewId: ctx.reviewRun.id,
      durationMinutes,
      version: newVersion,
      status: "DRAFT",
      createdAt: existingPkg?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.defenseRepo.savePackage(pkgRecord);
  }

  /**
   * Generates a specific defense component via AI Router
   */
  static async generateComponent(params: {
    projectId: string;
    userId: string;
    componentType: DefenseComponentType;
    requestId?: string;
  }): Promise<ProjectDefenseComponentRecord> {
    const { projectId, userId, componentType, requestId } = params;

    const pkg = await this.defenseRepo.findLatestPackage(projectId);
    if (!pkg) {
      throw new Error("PACKAGE_NOT_FOUND: Cần khởi tạo gói bảo vệ trước");
    }

    const ctx = await DefenseContextBuilder.buildDefenseContext({
      projectId,
      userId,
      durationMinutes: pkg.durationMinutes,
    });

    // 1. Quota Check
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    // 2. Assemble Skill Context
    const builtContext = await buildAIContext({
      taskType: "DRAFT",
      contextInput: {
        subjectGroup: ctx.project.subjectGroup as any,
        educationLevel: ctx.project.educationLevel as any,
        taskType: "DRAFT",
        workflowStage: "FINALIZE",
        documentType: "SOLUTION",
      },
      targetSchemaName: `defense-${componentType.toLowerCase().replace(/_/g, "-")}`,
      userPrompt: `Tạo thành phần ${componentType} cho đề tài ${ctx.project.title}`,
    });

    let systemPrompt = "";
    let userPrompt = "";
    let targetSchema = "";

    // 3. Prompt selection per component type
    if (componentType === "OUTLINE") {
      targetSchema = "defense-outline";
      const p = DefensePromptBuilder.buildOutlinePrompt({
        project: ctx.project,
        draft: ctx.draft,
        verifiedFacts: ctx.verifiedFacts,
        durationMinutes: pkg.durationMinutes,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    } else if (componentType === "SCRIPT") {
      targetSchema = "defense-script";
      const components = await this.defenseRepo.findComponentsByPackage(pkg.id);
      const outline = components.find((c) => c.componentType === "OUTLINE")?.contentJson || {};
      const p = DefensePromptBuilder.buildScriptPrompt({
        project: ctx.project,
        draft: ctx.draft,
        verifiedFacts: ctx.verifiedFacts,
        durationMinutes: pkg.durationMinutes,
        outlineJson: outline,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    } else if (componentType === "SLIDES") {
      targetSchema = "defense-slides";
      const p = DefensePromptBuilder.buildSlidesPrompt({
        project: ctx.project,
        draft: ctx.draft,
        durationMinutes: pkg.durationMinutes,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    } else if (componentType === "SPEAKER_NOTES") {
      targetSchema = "defense-speaker-notes";
      const components = await this.defenseRepo.findComponentsByPackage(pkg.id);
      const slides = components.find((c) => c.componentType === "SLIDES")?.contentJson || [];
      const p = DefensePromptBuilder.buildSpeakerNotesPrompt({
        project: ctx.project,
        slidesJson: slides,
        durationMinutes: pkg.durationMinutes,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    } else if (componentType === "JURY_QUESTIONS") {
      targetSchema = "defense-jury-questions";
      const p = DefensePromptBuilder.buildJuryQuestionsPrompt({
        project: ctx.project,
        draft: ctx.draft,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    } else if (componentType === "ANSWER_FRAMEWORKS") {
      targetSchema = "defense-answer-frameworks";
      const components = await this.defenseRepo.findComponentsByPackage(pkg.id);
      const questions = components.find((c) => c.componentType === "JURY_QUESTIONS")?.contentJson || [];
      const p = DefensePromptBuilder.buildAnswerFrameworksPrompt({
        project: ctx.project,
        questionsJson: questions,
        verifiedFacts: ctx.verifiedFacts,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    } else if (componentType === "ONE_PAGE_SUMMARY") {
      targetSchema = "defense-one-page-summary";
      const p = DefensePromptBuilder.buildOnePageSummaryPrompt({
        project: ctx.project,
        draft: ctx.draft,
        skillInstructions: builtContext.systemPrompt,
      });
      systemPrompt = p.systemPrompt;
      userPrompt = p.userPrompt;
    }

    // 4. AI Router Execution
    const aiRes = await AIRouter.execute({
      taskType: "DRAFT",
      systemPrompt,
      userPrompt,
      targetSchemaName: targetSchema,
      logicalRequestId: requestId,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("DEFENSE_SCHEMA_INVALID: AI không trả về JSON hợp lệ");
    }

    const schemaVal = validateAgainstSchema(targetSchema, parsed);
    if (!schemaVal.valid) {
      throw new Error(`DEFENSE_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    // 5. Business & Timing Validation
    if (componentType === "OUTLINE") {
      const timingVal = DefenseConsistencyService.validateOutlineTiming(parsed, pkg.durationMinutes);
      if (!timingVal.valid) {
        // Adjust duration if needed or record warning
      }
    }

    // 6. Save Component
    const componentRecord: ProjectDefenseComponentRecord = {
      id: `comp_${Date.now()}_${componentType.toLowerCase()}`,
      defensePackageId: pkg.id,
      projectId,
      componentType,
      version: 1,
      contentJson: parsed,
      status: "READY",
      aiRequestId: requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.defenseRepo.saveComponent(componentRecord);

    // 7. Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
    });

    return saved;
  }

  /**
   * Starts a new Mock Defense practice session
   */
  static async startPracticeSession(params: {
    projectId: string;
    userId: string;
  }): Promise<ProjectDefensePracticeSessionRecord> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const pkg = await this.defenseRepo.findLatestPackage(projectId);

    const sessionRecord: ProjectDefensePracticeSessionRecord = {
      id: `sess_prac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      defensePackageId: pkg?.id || null,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
    };

    return await this.defenseRepo.savePracticeSession(sessionRecord);
  }

  /**
   * Evaluates teacher's answer in Mock Defense rehearsal room
   */
  static async submitPracticeAnswer(params: {
    projectId: string;
    userId: string;
    sessionId: string;
    questionId: string;
    questionText: string;
    answerText: string;
    requestId?: string;
  }): Promise<ProjectDefensePracticeTurnRecord> {
    const { projectId, userId, sessionId, questionId, questionText, answerText, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    // Quota Check
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    const ctx = await DefenseContextBuilder.buildDefenseContext({ projectId, userId });

    const { systemPrompt, userPrompt } = DefensePromptBuilder.buildAnswerEvaluationPrompt({
      project,
      questionText,
      answerText,
      verifiedFacts: ctx.verifiedFacts,
    });

    const aiRes = await AIRouter.execute({
      taskType: "DRAFT",
      systemPrompt,
      userPrompt,
      targetSchemaName: "defense-answer-evaluation",
      logicalRequestId: requestId,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("EVALUATION_SCHEMA_INVALID: AI không trả về JSON hợp lệ");
    }

    const schemaVal = validateAgainstSchema("defense-answer-evaluation", parsed);
    if (!schemaVal.valid) {
      throw new Error(`EVALUATION_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    const turnRecord: ProjectDefensePracticeTurnRecord = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      questionId,
      questionText,
      answerText,
      evaluationJson: parsed,
      createdAt: new Date().toISOString(),
    };

    const saved = await this.defenseRepo.savePracticeTurn(turnRecord);

    // Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
    });

    return saved;
  }

  /**
   * Completes defense presentation stage
   */
  static async completeDefensePackage(params: {
    projectId: string;
    userId: string;
    confirmed: boolean;
  }): Promise<ProjectDefensePackageRecord> {
    const { projectId, userId, confirmed } = params;

    if (!confirmed) {
      throw new Error("DEFENSE_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận đã kiểm tra gói báo cáo bảo vệ");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const pkg = await this.defenseRepo.findLatestPackage(projectId);
    if (!pkg) throw new Error("PACKAGE_NOT_FOUND: Chưa có gói báo cáo bảo vệ");

    pkg.status = "COMPLETED";
    pkg.completedAt = new Date().toISOString();
    pkg.updatedAt = new Date().toISOString();

    const savedPkg = await this.defenseRepo.savePackage(pkg);

    // Update project
    await this.projectRepo.update(projectId, userId, {
      progressPercent: 100,
    });

    return savedPkg;
  }
}
