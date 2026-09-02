import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { ReviewerContextBuilder } from "@/lib/ai/reviewer-context-builder";
import { ReviewerPromptBuilder } from "@/lib/ai/prompts/reviewer-prompt-builder";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { ReviewValidator } from "@/server/services/review-validator";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type {
  FullReviewPayload,
  ProjectReviewRunRecord,
  ProjectReviewFindingRecord,
  FindingStatus,
  ReviewFindingItem,
} from "@/types/review";

export class ReviewerService {
  private static projectRepo = new ProjectRepository();
  private static writerRepo = new WriterRepository();
  private static reviewRepo = new ReviewerRepository();

  /**
   * Retrieves full state of AI Reviewer for a project
   */
  static async getReviewState(params: { projectId: string; userId: string }) {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    const latestRun = await this.reviewRepo.findLatestReviewRun(projectId);
    const findings = latestRun ? await this.reviewRepo.findFindingsByRun(latestRun.id) : [];

    const isStale = Boolean(
      latestRun && draft && draft.version > latestRun.documentVersion
    );

    const mandatoryFixes = findings.filter((f) => f.findingType === "MANDATORY_FIX");
    const qualityImprovements = findings.filter((f) => f.findingType === "QUALITY_IMPROVEMENT");
    const keepAsIs = findings.filter((f) => f.findingType === "KEEP_AS_IS");
    const priorityRevisions = findings.filter((f) => f.findingType === "PRIORITY_REVISION");

    const blockingCount = mandatoryFixes.filter((f) => f.severity === "BLOCKING" && f.status === "OPEN").length;

    return {
      project,
      draft,
      latestRun,
      isStale,
      findings,
      mandatoryFixes,
      qualityImprovements,
      keepAsIs,
      priorityRevisions,
      blockingCount,
    };
  }

  /**
   * Executes a full document AI Review
   */
  static async runFullReview(params: {
    projectId: string;
    userId: string;
    requestId?: string;
  }): Promise<{ run: ProjectReviewRunRecord; findings: ProjectReviewFindingRecord[] }> {
    const { projectId, userId, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    if (!draft || draft.status !== "READY_FOR_REVIEW") {
      throw new Error("DOCUMENT_NOT_READY_FOR_REVIEW: Bản thảo chưa sẵn sàng để rà soát toàn bài");
    }

    // 1. Entitlement & Quota Check
    await requireQuota({
      userId,
      feature: "AI_REVIEW",
      requestedAmount: 1,
      requestId,
    });

    // 2. Build Reviewer Context
    const ctx = await ReviewerContextBuilder.buildReviewerContext({ projectId, userId });

    // 3. Assemble Skill Context
    const builtContext = await buildAIContext({
      taskType: "REVIEW",
      contextInput: {
        subjectGroup: project.subjectGroup as any,
        educationLevel: project.educationLevel as any,
        taskType: "REVIEW",
        workflowStage: "REVIEW",
        documentType: project.documentType,
      },
      targetSchemaName: "full-review",
      userPrompt: `Rà soát toàn văn bản thảo đề tài "${project.title}"`,
    });

    // 4. Build Full Review Prompt
    const { systemPrompt, userPrompt } = ReviewerPromptBuilder.buildFullReviewPrompt({
      project: ctx.project,
      draft: ctx.draft,
      consistency: ctx.consistency,
      lockedSections: ctx.lockedSections,
      verifiedFacts: ctx.verifiedFacts,
      skillInstructions: builtContext.systemPrompt,
    });

    // 5. Execute via AI Router
    const aiRes = await AIRouter.execute({
      taskType: "REVIEW",
      systemPrompt,
      userPrompt,
      targetSchemaName: "full-review",
      logicalRequestId: requestId,
    });

    let parsed: FullReviewPayload;
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("REVIEW_SCHEMA_INVALID: AI không trả về JSON hợp lệ");
    }

    // 6. Schema & Business Validation
    const schemaVal = validateAgainstSchema("full-review", parsed);
    if (!schemaVal.valid) {
      throw new Error(`REVIEW_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    const bizVal = ReviewValidator.validateReview(parsed);
    if (!bizVal.valid) {
      throw new Error(`REVIEW_BUSINESS_INVALID: ${bizVal.errors.join("; ")}`);
    }

    // 7. Persist Review Run
    const existingRun = await this.reviewRepo.findLatestReviewRun(projectId);
    const newVersion = (existingRun?.reviewVersion || 0) + 1;

    const runRecord: ProjectReviewRunRecord = {
      id: `rev_${Date.now()}_v${newVersion}`,
      projectId,
      documentDraftId: draft.id,
      documentVersion: draft.version,
      reviewVersion: newVersion,
      status: "READY",
      rubricSource: "DEFAULT_KNOWLEDGE_PACK",
      summaryJson: {
        overallAssessment: parsed.summary.overallAssessment,
        strengths: parsed.summary.strengths,
        mainRisks: parsed.summary.mainRisks,
        rubric: parsed.rubric,
        priorityRevisions: parsed.priorityRevisions,
      },
      aiRequestId: requestId,
      dataVersion: 1,
      structureVersion: 1,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const savedRun = await this.reviewRepo.saveReviewRun(runRecord);

    // 8. Persist Findings
    const findingsToSave: ProjectReviewFindingRecord[] = [];

    // Mandatory Fixes
    parsed.mandatoryFixes.forEach((f, idx) => {
      findingsToSave.push({
        id: `f_man_${Date.now()}_${idx}`,
        reviewRunId: savedRun.id,
        projectId,
        category: f.category as any,
        severity: f.severity,
        findingType: "MANDATORY_FIX",
        title: f.title,
        description: f.description,
        whyItMatters: f.whyItMatters,
        suggestedFix: f.suggestedFix,
        requiredDataKeys: f.requiredDataKeys,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Quality Improvements
    parsed.qualityImprovements.forEach((f, idx) => {
      findingsToSave.push({
        id: `f_qi_${Date.now()}_${idx}`,
        reviewRunId: savedRun.id,
        projectId,
        category: f.category as any,
        severity: f.severity,
        findingType: "QUALITY_IMPROVEMENT",
        title: f.title,
        description: f.description,
        whyItMatters: f.whyItMatters,
        suggestedFix: f.suggestedFix,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Keep As Is
    parsed.keepAsIs.forEach((f, idx) => {
      findingsToSave.push({
        id: `f_kai_${Date.now()}_${idx}`,
        reviewRunId: savedRun.id,
        projectId,
        category: f.category as any,
        severity: f.severity,
        findingType: "KEEP_AS_IS",
        title: f.title,
        description: f.description,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Priority Revisions (Exactly 3)
    parsed.priorityRevisions.forEach((p) => {
      findingsToSave.push({
        id: `f_prio_${Date.now()}_${p.priorityNumber}`,
        reviewRunId: savedRun.id,
        projectId,
        category: "SOLUTION",
        severity: p.priorityNumber === 1 ? "BLOCKING" : "HIGH",
        findingType: "PRIORITY_REVISION",
        priorityNumber: p.priorityNumber,
        title: `Ưu tiên ${p.priorityNumber}: ${p.problem.substring(0, 60)}...`,
        description: p.problem,
        whyItMatters: p.whyItMatters,
        suggestedFix: p.recommendedChange,
        requiredDataKeys: p.requiredEvidenceOrData,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const savedFindings = await this.reviewRepo.saveFindings(findingsToSave);

    // 9. Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: "AI_REVIEW",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
    });

    return { run: savedRun, findings: savedFindings };
  }

  /**
   * Updates status of a finding (ACCEPTED, DISMISSED, RESOLVED)
   */
  static async updateFindingStatus(params: {
    projectId: string;
    userId: string;
    findingId: string;
    status: FindingStatus;
  }): Promise<ProjectReviewFindingRecord> {
    const { projectId, userId, findingId, status } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    return await this.reviewRepo.updateFindingStatus(findingId, status);
  }

  /**
   * Generates a targeted AI revision for a single finding without rewriting full document
   */
  static async generateTargetedRevision(params: {
    projectId: string;
    userId: string;
    findingId: string;
    requestId?: string;
  }) {
    const { projectId, userId, findingId, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const finding = await this.reviewRepo.findFindingById(findingId);
    if (!finding) throw new Error("FINDING_NOT_FOUND");

    // Check quota for revision
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    // Find first available section or default section 1
    const sections = await this.writerRepo.findSectionsByProject(projectId);
    const targetSection = sections[0] || {
      id: "sec_1",
      promptNumber: 1,
      title: "Mục đề tài",
      content: "",
      version: 1,
    };

    const ctx = await ReviewerContextBuilder.buildReviewerContext({ projectId, userId });

    const findingItem: ReviewFindingItem = {
      title: finding.title,
      description: finding.description,
      category: finding.category,
      severity: finding.severity,
      whyItMatters: finding.whyItMatters || undefined,
      suggestedFix: finding.suggestedFix || undefined,
      requiredDataKeys: finding.requiredDataKeys,
    };

    const { systemPrompt, userPrompt } = ReviewerPromptBuilder.buildTargetedRevisionPrompt({
      project,
      finding: findingItem,
      sectionTitle: targetSection.title,
      sectionContent: targetSection.content,
      verifiedFacts: ctx.verifiedFacts,
    });

    const aiRes = await AIRouter.execute({
      taskType: "DRAFT",
      systemPrompt,
      userPrompt,
      targetSchemaName: "review-revision",
      logicalRequestId: requestId,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("REVISION_SCHEMA_INVALID: AI không trả về JSON hợp lệ");
    }

    const schemaVal = validateAgainstSchema("review-revision", parsed);
    if (!schemaVal.valid) {
      throw new Error(`REVISION_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    // Save as new section version
    const newVersion = targetSection.version + 1;
    const updatedSection = {
      ...targetSection,
      content: parsed.revisedContent,
      version: newVersion,
      status: "USER_EDITED" as const,
      source: "AI_GENERATED" as const,
      updatedAt: new Date().toISOString(),
    };

    await this.writerRepo.saveSection(updatedSection);

    await this.writerRepo.saveSectionVersion({
      id: `ver_${Date.now()}_rev_${newVersion}`,
      sectionId: targetSection.id,
      projectId,
      promptNumber: targetSection.promptNumber,
      version: newVersion,
      content: parsed.revisedContent,
      source: "AI_GENERATED",
      createdBy: userId,
      aiRequestId: requestId,
      createdAt: new Date().toISOString(),
    });

    // Mark finding as RESOLVED
    await this.reviewRepo.updateFindingStatus(findingId, "RESOLVED");

    // Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: "AI_GENERATE",
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
    });

    return {
      section: updatedSection,
      changesSummary: parsed.changesSummary,
    };
  }
}
