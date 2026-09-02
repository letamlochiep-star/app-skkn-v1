import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { ProjectSessionService } from "@/server/services/project-session-service";
import { PromptSetBuilder, PROMPT_18_STANDARD_TEXT } from "@/lib/ai/prompts/prompt-set-builder";
import { PromptSetValidator } from "@/server/services/prompt-set-validator";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type { ProjectPromptSet, ProjectPrompt } from "@/types/prompt";

export class PromptSetService {
  private static projectRepo = new ProjectRepository();
  private static structureRepo = new StructureRepository();
  private static promptRepo = new PromptSetRepository();

  /**
   * Retrieves prompt set state for a project
   */
  static async getPromptSetState(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    project: any;
    promptSet: ProjectPromptSet | null;
    isStructureLocked: boolean;
  }> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const promptSet = await this.promptRepo.findCurrentByProject(projectId);

    return {
      project,
      promptSet,
      isStructureLocked: Boolean(project.structureLocked),
    };
  }

  /**
   * Generates the complete 18-Prompt set for a project after structure is locked
   */
  static async generatePromptSet(params: {
    projectId: string;
    userId: string;
    requestId?: string;
  }): Promise<ProjectPromptSet> {
    const { projectId, userId, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (!project.topicLocked) {
      throw new Error("TOPIC_NOT_LOCKED: Dự án chưa chốt tên đề tài");
    }

    if (!project.structureLocked) {
      throw new Error("STRUCTURE_NOT_LOCKED: Cần hoàn thành và khóa cấu trúc đề tài trước khi sinh bộ 18 câu lệnh");
    }

    const structure = await this.structureRepo.findCurrentByProject(projectId);
    if (!structure) {
      throw new Error("STRUCTURE_NOT_FOUND: Chưa tìm thấy cấu trúc đã khóa");
    }

    // 1. Quota Check
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    // 2. Build Structured Project Session
    const sessionRes = await ProjectSessionService.buildProjectSession(projectId, userId);
    if (!sessionRes.valid) {
      throw new Error("DATA_NOT_READY_FOR_PROMPTS: Dữ liệu dự án chưa hoàn thiện");
    }

    const rawFacts = await this.projectRepo.getFacts(projectId);
    const verifiedFacts: Record<string, unknown> = {};
    rawFacts.forEach((f) => {
      verifiedFacts[f.key] = f.valueJson;
    });

    // 3. Assemble AI Context
    const builtContext = await buildAIContext({
      taskType: "DRAFT",
      contextInput: {
        subjectGroup: project.subjectGroup as any,
        educationLevel: project.educationLevel as any,
        taskType: "DRAFT",
        workflowStage: "STRUCTURE",
        documentType: project.documentType,
      },
      targetSchemaName: "18-prompt-set",
      userPrompt: `Tạo bộ đúng 18 câu lệnh cho ${project.title || project.workingTitle}`,
    });

    // 4. Build Prompt Set Builder Prompt
    const { systemPrompt, userPrompt } = PromptSetBuilder.buildGenerate18PromptsPrompt({
      session: sessionRes.session,
      officialTitle: project.title || project.workingTitle,
      lockedSections: structure.structureJson,
      verifiedFacts,
      skillInstructions: builtContext.systemPrompt,
    });

    // 5. Execute via AI Router
    const aiRes = await AIRouter.execute({
      taskType: "DRAFT",
      systemPrompt,
      userPrompt,
      targetSchemaName: "18-prompt-set",
      logicalRequestId: requestId,
    });

    let parsed: { prompts: any[]; promptFrameworkVersion: string };
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("PROMPT_SET_SCHEMA_INVALID: AI không trả về bộ câu lệnh JSON hợp lệ");
    }

    const schemaVal = validateAgainstSchema("18-prompt-set", parsed);
    if (!schemaVal.valid) {
      throw new Error(`PROMPT_SET_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    const promptSetId = `pset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Ensure Prompt 18 adheres to standard immutable text
    const prompts: ProjectPrompt[] = parsed.prompts.map((p) => {
      const isP18 = p.number === 18;
      return {
        id: `p_${Date.now()}_${p.number}`,
        promptSetId,
        projectId,
        promptNumber: p.number,
        title: p.title,
        purpose: p.purpose,
        promptText: isP18 ? PROMPT_18_STANDARD_TEXT : p.promptText,
        requiredDataKeys: p.requiredDataKeys || [],
        missingDataKeys: p.missingDataKeys || [],
        status: p.missingDataKeys && p.missingDataKeys.length > 0 ? "READY_WITH_PLACEHOLDERS" : "READY",
        immutable: isP18,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // 6. Business & Strict Validation
    const valRes = PromptSetValidator.validatePromptSet(prompts, structure.structureJson, verifiedFacts);
    if (!valRes.valid) {
      throw new Error(`PROMPT_SET_INVALID: ${valRes.errors.join("; ")}`);
    }

    // 7. Save Prompt Set
    const promptSetRecord: ProjectPromptSet = {
      id: promptSetId,
      projectId,
      structureId: structure.id,
      version: 1,
      status: "READY",
      promptCount: 18,
      dataVersion: 1,
      promptFrameworkVersion: parsed.promptFrameworkVersion || "18-prompt-framework-v1",
      aiRequestId: requestId,
      prompts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.promptRepo.savePromptSet(promptSetRecord);

    // 8. Record AI Usage
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
   * Updates prompt text for a single prompt
   */
  static async updatePrompt(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
    promptText: string;
  }): Promise<ProjectPrompt> {
    const { projectId, userId, promptNumber, promptText } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const promptSet = await this.promptRepo.findCurrentByProject(projectId);
    if (!promptSet) throw new Error("PROMPT_SET_NOT_FOUND");

    if (promptNumber === 18) {
      throw new Error("PROMPT_IMMUTABLE: Câu lệnh số 18 là câu lệnh chuẩn bắt buộc và không thể chỉnh sửa.");
    }

    const updated = await this.promptRepo.updatePromptText(projectId, promptSet.id, promptNumber, promptText);
    if (!updated) throw new Error("PROMPT_NOT_FOUND");

    return updated;
  }

  /**
   * Completes Step 2 (Structure & Prompts) and transitions project to Step 4 (WRITE)
   * Atomic server-side operation, no AI quota charge
   */
  static async completeStep2(params: {
    projectId: string;
    userId: string;
    confirmed: boolean;
  }) {
    const { projectId, userId, confirmed } = params;

    if (!confirmed) {
      throw new Error("STEP2_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận cấu trúc và bộ câu lệnh trước khi hoàn thành");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (!project.structureLocked) {
      throw new Error("STRUCTURE_NOT_LOCKED: Cần khóa cấu trúc trước khi hoàn thành Bước 2");
    }

    const promptSet = await this.promptRepo.findCurrentByProject(projectId);
    if (!promptSet || promptSet.status !== "READY" || promptSet.promptCount !== 18) {
      throw new Error("PROMPT_SET_NOT_READY: Bộ 18 câu lệnh chưa sẵn sàng");
    }

    // Atomic transition to WRITE stage (Step 4 / 6)
    const updated = await this.projectRepo.update(projectId, userId, {
      workflowStage: "WRITE",
      progressPercent: 70,
    });

    return updated;
  }
}
