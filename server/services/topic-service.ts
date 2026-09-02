import { ProjectRepository } from "@/server/repositories/project-repository";
import { TopicRepository } from "@/server/repositories/topic-repository";
import { TopicInputService } from "@/server/services/topic-input-service";
import { ProjectSessionService } from "@/server/services/project-session-service";
import { TopicPromptBuilder } from "@/lib/ai/prompts/topic-prompt-builder";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { AIDataIntegrityService } from "@/server/services/ai-data-integrity-service";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type {
  TopicCandidate,
  TopicAnalysisResult,
  TopicSuggestionsResult,
  TopicInputStatus,
} from "@/types/topic";
import type { ProjectRecord } from "@/types/project";

export class TopicService {
  private static projectRepo = new ProjectRepository();
  private static topicRepo = new TopicRepository();

  /**
   * Retrieves complete Topic Step state for a project
   */
  static async getTopicState(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    project: ProjectRecord;
    stage: string;
    locked: boolean;
    officialTitle: string | null;
    workingTitle: string;
    candidates: TopicCandidate[];
    inputStatus: TopicInputStatus;
  }> {
    const { projectId, userId } = params;
    const project = await this.projectRepo.findById(projectId, userId);

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND: Không tìm thấy dự án hoặc không có quyền truy cập");
    }

    const candidates = await this.topicRepo.listCandidatesByProject(projectId);
    const inputStatus = await TopicInputService.getTopicInputStatus(projectId, userId);

    return {
      project,
      stage: project.workflowStage,
      locked: project.topicLocked,
      officialTitle: project.topicLocked ? project.title : null,
      workingTitle: project.workingTitle,
      candidates,
      inputStatus,
    };
  }

  /**
   * Branch A: Analyzes an existing title and suggests up to 3 optimized variants
   */
  static async analyzeTopic(params: {
    projectId: string;
    userId: string;
    title: string;
    requestId?: string;
  }): Promise<{
    analysis: TopicAnalysisResult;
    candidates: TopicCandidate[];
  }> {
    const { projectId, userId, title, requestId } = params;

    const trimmedTitle = title?.trim();
    if (!trimmedTitle || trimmedTitle.length < 5) {
      throw new Error("TOPIC_INVALID_INPUT: Tên đề tài cần phân tích phải từ 5 ký tự trở lên");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.topicLocked) {
      throw new Error("TOPIC_ALREADY_LOCKED: Tên đề tài của dự án này đã được chốt");
    }

    // 1. Enforce AI Quota
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    // 2. Build Structured Project Session
    const sessionRes = await ProjectSessionService.buildProjectSession(projectId, userId);
    if (!sessionRes.valid) {
      throw new Error(`TOPIC_SESSION_INVALID: Cấu trúc dữ liệu dự án không hợp lệ: ${sessionRes.validationErrors?.join(", ")}`);
    }

    // 3. Assemble Multi-tier AI Context
    const builtContext = await buildAIContext({
      taskType: "IDEATE",
      contextInput: {
        subjectGroup: project.subjectGroup as any,
        educationLevel: project.educationLevel as any,
        taskType: "IDEATE",
        workflowStage: "TOPIC",
        documentType: project.documentType,
      },
      targetSchemaName: "topic-analysis",
      userPrompt: trimmedTitle,
    });

    // 4. Build Detailed Topic Analysis Prompt
    const { systemPrompt, userPrompt } = TopicPromptBuilder.buildAnalyzeTopicPrompt({
      session: sessionRes.session,
      titleToAnalyze: trimmedTitle,
      skillInstructions: builtContext.systemPrompt,
    });

    // 5. Execute via AI Router
    const aiResponse = await AIRouter.execute({
      taskType: "IDEATE",
      systemPrompt,
      userPrompt,
      targetSchemaName: "topic-analysis",
      logicalRequestId: requestId,
    });

    // Parse structured output
    let parsed: TopicAnalysisResult;
    try {
      parsed = JSON.parse(aiResponse.content) as TopicAnalysisResult;
    } catch {
      throw new Error("TOPIC_SCHEMA_INVALID: AI không trả về định dạng JSON hợp lệ");
    }

    // 6. Schema Validation
    const schemaVal = validateAgainstSchema("topic-analysis", parsed);
    if (!schemaVal.valid) {
      throw new Error(`TOPIC_SCHEMA_INVALID: Kết quả phân tích không đúng schema: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    // 7. Data Integrity Verification
    const integrity = AIDataIntegrityService.validateTopicOutput(parsed, {
      problemStatement: sessionRes.session.contextData.collectedFacts?.problemStatement,
      targetGroup: sessionRes.session.contextData.collectedFacts?.targetGroup,
      gradeLevel: project.gradeLevel,
      schoolName: project.schoolName,
    });

    if (!integrity.pass) {
      throw new Error(`TOPIC_DATA_INTEGRITY_FAILED: AI tự sinh dữ liệu không có trong hồ sơ: ${integrity.violations.join("; ")}`);
    }

    // 8. Save Candidates
    const candidatesToSave: TopicCandidate[] = parsed.suggestions.map((s, idx) => ({
      id: `cand_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      source: "AI_SUGGESTED",
      title: s.title,
      rationale: s.rationale,
      strengths: [s.direction, s.evidenceFeasibility],
      evidenceFeasibility: s.evidenceFeasibility,
      notes: `Phương án ${idx + 1} (${s.direction})`,
      rank: idx + 1,
      status: "PROPOSED",
      aiRequestId: aiResponse.requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const savedCandidates = await this.topicRepo.saveCandidates(candidatesToSave);

    // 9. Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
      metadataJson: {
        action: "analyze_topic",
        tokensUsed: aiResponse.tokenUsage.totalTokens,
        provider: aiResponse.provider,
      },
    });

    return {
      analysis: parsed,
      candidates: savedCandidates,
    };
  }

  /**
   * Branch B: Suggests exactly 5 topic candidates from pedagogical context
   */
  static async suggestTopics(params: {
    projectId: string;
    userId: string;
    requestId?: string;
  }): Promise<{
    suggestions: TopicSuggestionsResult;
    candidates: TopicCandidate[];
  }> {
    const { projectId, userId, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.topicLocked) {
      throw new Error("TOPIC_ALREADY_LOCKED: Tên đề tài của dự án này đã được chốt");
    }

    // 1. Check Missing Data
    const inputStatus = await TopicInputService.getTopicInputStatus(projectId, userId);
    if (!inputStatus.readyForSuggestion) {
      const missingLabels = inputStatus.missing.filter((m) => m.required).map((m) => m.label).join(", ");
      throw new Error(`TOPIC_NOT_READY: Thầy/Cô vui lòng cung cấp thêm thông tin bắt buộc: ${missingLabels}`);
    }

    // 2. Enforce AI Quota
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    // 3. Build Structured Project Session
    const sessionRes = await ProjectSessionService.buildProjectSession(projectId, userId);
    if (!sessionRes.valid) {
      throw new Error(`TOPIC_SESSION_INVALID: Dữ liệu dự án không hợp lệ: ${sessionRes.validationErrors?.join(", ")}`);
    }

    // 4. Assemble Multi-tier AI Context
    const builtContext = await buildAIContext({
      taskType: "IDEATE",
      contextInput: {
        subjectGroup: project.subjectGroup as any,
        educationLevel: project.educationLevel as any,
        taskType: "IDEATE",
        workflowStage: "TOPIC",
        documentType: project.documentType,
      },
      targetSchemaName: "topic-suggestions",
      userPrompt: `Gợi ý 5 tên đề tài cho dự án ${project.documentType}`,
    });

    // 5. Build Suggest Topics Prompt
    const { systemPrompt, userPrompt } = TopicPromptBuilder.buildSuggestTopicsPrompt({
      session: sessionRes.session,
      skillInstructions: builtContext.systemPrompt,
    });

    // 6. Execute via AI Router
    const aiResponse = await AIRouter.execute({
      taskType: "IDEATE",
      systemPrompt,
      userPrompt,
      targetSchemaName: "topic-suggestions",
      logicalRequestId: requestId,
    });

    let parsed: TopicSuggestionsResult;
    try {
      parsed = JSON.parse(aiResponse.content) as TopicSuggestionsResult;
    } catch {
      throw new Error("TOPIC_SCHEMA_INVALID: AI không trả về định dạng JSON hợp lệ");
    }

    // 7. Schema Validation
    const schemaVal = validateAgainstSchema("topic-suggestions", parsed);
    if (!schemaVal.valid) {
      throw new Error(`TOPIC_SCHEMA_INVALID: Kết quả gợi ý không đúng schema: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    // 8. Data Integrity Verification
    const integrity = AIDataIntegrityService.validateTopicOutput(parsed, {
      problemStatement: sessionRes.session.contextData.collectedFacts?.problemStatement,
      targetGroup: sessionRes.session.contextData.collectedFacts?.targetGroup,
      gradeLevel: project.gradeLevel,
      schoolName: project.schoolName,
    });

    if (!integrity.pass) {
      throw new Error(`TOPIC_DATA_INTEGRITY_FAILED: AI tự sinh dữ liệu không có trong hồ sơ: ${integrity.violations.join("; ")}`);
    }

    // 9. Save Candidates (5 items)
    const candidatesToSave: TopicCandidate[] = parsed.topics.map((t, idx) => ({
      id: `cand_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      source: "AI_SUGGESTED",
      title: t.title,
      rationale: t.rationale,
      strengths: t.strengths,
      evidenceFeasibility: t.evidenceFeasibility,
      notes: idx === parsed.recommendedIndex ? `[AI Khuyến nghị] ${t.notes}` : t.notes,
      rank: idx + 1,
      status: "PROPOSED",
      aiRequestId: aiResponse.requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const savedCandidates = await this.topicRepo.saveCandidates(candidatesToSave);

    // 10. Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
      metadataJson: {
        action: "suggest_topics",
        tokensUsed: aiResponse.tokenUsage.totalTokens,
        provider: aiResponse.provider,
      },
    });

    return {
      suggestions: parsed,
      candidates: savedCandidates,
    };
  }

  /**
   * Selects or edits a candidate title
   */
  static async selectTopicCandidate(params: {
    projectId: string;
    userId: string;
    candidateId: string;
    editedTitle?: string;
  }): Promise<TopicCandidate> {
    const { projectId, userId, candidateId, editedTitle } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    if (project.topicLocked) throw new Error("TOPIC_ALREADY_LOCKED");

    const candidate = await this.topicRepo.findCandidateById(candidateId, projectId);
    if (!candidate) throw new Error("TOPIC_CANDIDATE_NOT_FOUND: Không tìm thấy phương án");

    const newTitle = editedTitle?.trim() || candidate.title;
    const isEdited = Boolean(editedTitle && editedTitle.trim() !== candidate.title);

    const updated = await this.topicRepo.updateCandidate(candidateId, projectId, {
      title: newTitle,
      source: isEdited ? "USER_EDITED" : candidate.source,
      status: "SELECTED",
    });

    return updated!;
  }

  /**
   * Locks the official topic title (Atomic Server-Side Operation, No AI Quota charge)
   */
  static async lockTopic(params: {
    projectId: string;
    userId: string;
    candidateId?: string;
    finalTitle: string;
    confirmed: boolean;
  }): Promise<ProjectRecord> {
    const { projectId, userId, candidateId, finalTitle, confirmed } = params;

    if (!confirmed) {
      throw new Error("TOPIC_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận trước khi chốt tên đề tài");
    }

    const trimmed = finalTitle?.trim();
    if (!trimmed || trimmed.length < 5 || trimmed.length > 300) {
      throw new Error("TOPIC_INVALID_INPUT: Tên đề tài chính thức phải từ 5 đến 300 ký tự");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.topicLocked) {
      return project; // Idempotent success
    }

    const now = new Date().toISOString();

    // 1. Atomic Update on Project
    const updatedProject = await this.projectRepo.update(projectId, userId, {
      title: trimmed,
      topicLocked: true,
      workflowStage: "DATA",
      progressPercent: 30,
    });

    // 2. Mark Candidate as LOCKED if provided
    if (candidateId) {
      await this.topicRepo.updateCandidate(candidateId, projectId, {
        status: "LOCKED",
        title: trimmed,
      });
    }

    // 3. Record History
    await this.topicRepo.recordHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      action: "LOCKED",
      previousTitle: project.workingTitle || null,
      newTitle: trimmed,
      userId,
      createdAt: now,
    });

    return updatedProject;
  }

  /**
   * Unlocks topic title under controlled conditions
   */
  static async unlockTopic(params: {
    projectId: string;
    userId: string;
  }): Promise<ProjectRecord> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const updated = await this.projectRepo.update(projectId, userId, {
      topicLocked: false,
      workflowStage: "TOPIC",
      progressPercent: 10,
    });

    await this.topicRepo.recordHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      action: "UNLOCKED",
      previousTitle: project.title,
      newTitle: project.workingTitle || project.title,
      userId,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }
}
