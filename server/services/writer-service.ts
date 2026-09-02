import { ProjectRepository } from "@/server/repositories/project-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { WriterContextBuilder } from "@/lib/ai/writer-context-builder";
import { WriterPromptBuilder } from "@/lib/ai/prompts/writer-prompt-builder";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type {
  ProjectSectionRecord,
  ProjectSectionVersionRecord,
} from "@/types/writer";

export class WriterService {
  private static projectRepo = new ProjectRepository();
  private static promptRepo = new PromptSetRepository();
  private static writerRepo = new WriterRepository();

  /**
   * Retrieves full state for AI Writer Workspace
   */
  static async getWriterState(params: {
    projectId: string;
    userId: string;
  }) {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (!project.structureLocked) {
      throw new Error("STRUCTURE_NOT_LOCKED: Cần khóa cấu trúc trước khi mở AI Writer");
    }

    const promptSet = await this.promptRepo.findCurrentByProject(projectId);
    if (!promptSet || promptSet.status !== "READY" || promptSet.promptCount !== 18) {
      throw new Error("PROMPTS_NOT_READY: Bộ 18 câu lệnh chưa sẵn sàng");
    }

    const sections = await this.writerRepo.findSectionsByProject(projectId);

    const completedCount = sections.filter((s) => s.content.trim().length > 0).length;
    const approvedCount = sections.filter((s) => s.status === "APPROVED").length;

    const allContent = sections.map((s) => s.content).join(" ");
    const placeholdersCount = (allContent.match(/\[CHỜ/g) || []).length;

    return {
      project,
      promptSet,
      prompts: promptSet.prompts || [],
      sections,
      completedCount,
      approvedCount,
      placeholdersCount,
    };
  }

  /**
   * Generates or regenerates content for a single prompt
   */
  static async generatePromptContent(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
    requestId?: string;
    revisionMode?: string;
  }): Promise<ProjectSectionRecord> {
    const { projectId, userId, promptNumber, requestId, revisionMode } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (promptNumber < 1 || promptNumber > 18) {
      throw new Error(`INVALID_PROMPT_NUMBER: Prompt ${promptNumber} không hợp lệ (1..18)`);
    }

    // Gate for Prompt 18: Requires preceding sections to have draft content
    if (promptNumber === 18) {
      const existingSections = await this.writerRepo.findSectionsByProject(projectId);
      const preCount = existingSections.filter((s) => s.promptNumber < 18 && s.content.trim().length > 0).length;
      if (preCount < 10) {
        throw new Error("PROMPT_18_PREREQUISITE_FAILED: Prompt 18 là câu lệnh tổng hợp toàn văn, yêu cầu các phần trước đã có nội dung bản thảo.");
      }
    }

    // 1. Quota Check
    await requireQuota({
      userId,
      feature: "AI_GENERATE",
      requestedAmount: 1,
      requestId,
    });

    // 2. Build Selective Writer Context
    const ctx = await WriterContextBuilder.buildWriterContext({
      projectId,
      userId,
      promptNumber,
    });

    // 3. Assemble Skill Context
    const builtContext = await buildAIContext({
      taskType: "DRAFT",
      contextInput: {
        subjectGroup: project.subjectGroup as any,
        educationLevel: project.educationLevel as any,
        taskType: "DRAFT",
        workflowStage: "WRITE",
        documentType: project.documentType,
      },
      targetSchemaName: "writer-section",
      userPrompt: `Soạn thảo Prompt ${promptNumber}: ${ctx.prompt.title}`,
    });

    // 4. Build Prompt
    const { systemPrompt, userPrompt } = WriterPromptBuilder.buildSectionDraftPrompt({
      project: ctx.project,
      prompt: ctx.prompt,
      lockedSections: ctx.lockedSections,
      verifiedFacts: ctx.verifiedFacts,
      relevantPreviousSections: ctx.relevantPreviousSections,
      missingDataManifest: ctx.missingDataManifest,
      revisionMode,
      skillInstructions: builtContext.systemPrompt,
    });

    // 5. Execute via AI Router
    const aiRes = await AIRouter.execute({
      taskType: "DRAFT",
      systemPrompt,
      userPrompt,
      targetSchemaName: "writer-section",
      logicalRequestId: requestId,
    });

    let parsed: { promptNumber: number; section: { title: string; content: string } };
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("WRITER_SCHEMA_INVALID: AI không trả về JSON hợp lệ");
    }

    const schemaVal = validateAgainstSchema("writer-section", parsed);
    if (!schemaVal.valid) {
      throw new Error(`WRITER_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    // 6. Data Integrity Check (Detect fabricated stats)
    const content = parsed.section.content;
    const fakeMatches = content.match(/(\d{2,3})\s*(học sinh|em học sinh|hs)/gi);
    if (fakeMatches) {
      const knownText = JSON.stringify(ctx.verifiedFacts);
      for (const m of fakeMatches) {
        const num = m.match(/\d+/)?.[0];
        if (num && !knownText.includes(num)) {
          throw new Error(`DATA_INTEGRITY_VIOLATION: Phát hiện số liệu tự sinh trong nội dung: '${m}'.`);
        }
      }
    }

    // 7. Save or Update Section
    const existing = await this.writerRepo.findSectionByNumber(projectId, promptNumber);
    const newVersion = (existing?.version || 0) + 1;

    const sectionRecord: ProjectSectionRecord = {
      id: existing?.id || `sec_${Date.now()}_${promptNumber}`,
      projectId,
      promptNumber,
      title: parsed.section.title || ctx.prompt.title,
      content: parsed.section.content,
      status: "DRAFT",
      source: "AI_GENERATED",
      version: newVersion,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.writerRepo.saveSection(sectionRecord);

    // 8. Save Version History
    await this.writerRepo.saveSectionVersion({
      id: `ver_${Date.now()}_${newVersion}`,
      sectionId: saved.id,
      projectId,
      promptNumber,
      version: newVersion,
      content: parsed.section.content,
      source: "AI_GENERATED",
      createdBy: userId,
      aiRequestId: requestId,
      createdAt: new Date().toISOString(),
    });

    // 9. Record Usage
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
   * Saves manual user edits without charging AI quota
   */
  static async saveUserEdit(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
    content: string;
  }): Promise<ProjectSectionRecord> {
    const { projectId, userId, promptNumber, content } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const promptSet = await this.promptRepo.findCurrentByProject(projectId);
    const prompt = promptSet?.prompts?.find((p) => p.promptNumber === promptNumber);
    if (!prompt) throw new Error("PROMPT_NOT_FOUND");

    const existing = await this.writerRepo.findSectionByNumber(projectId, promptNumber);
    const newVersion = (existing?.version || 0) + 1;

    const sectionRecord: ProjectSectionRecord = {
      id: existing?.id || `sec_${Date.now()}_${promptNumber}`,
      projectId,
      promptNumber,
      title: prompt.title,
      content,
      status: "USER_EDITED",
      source: "USER_EDITED",
      version: newVersion,
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.writerRepo.saveSection(sectionRecord);

    // Save Version History
    await this.writerRepo.saveSectionVersion({
      id: `ver_${Date.now()}_${newVersion}`,
      sectionId: saved.id,
      projectId,
      promptNumber,
      version: newVersion,
      content,
      source: "USER_EDITED",
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });

    return saved;
  }

  /**
   * Approves a section content
   */
  static async approvePromptContent(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
  }): Promise<ProjectSectionRecord> {
    const { projectId, userId, promptNumber } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const section = await this.writerRepo.findSectionByNumber(projectId, promptNumber);
    if (!section || section.content.trim().length === 0) {
      throw new Error("SECTION_EMPTY: Chưa có nội dung để duyệt");
    }

    section.status = "APPROVED";
    section.approvedAt = new Date().toISOString();
    section.approvedBy = userId;
    section.updatedAt = new Date().toISOString();

    return await this.writerRepo.saveSection(section);
  }

  /**
   * Retrieves version history for a prompt
   */
  static async getPromptVersions(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
  }): Promise<ProjectSectionVersionRecord[]> {
    const { projectId, userId, promptNumber } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    return await this.writerRepo.getSectionVersions(projectId, promptNumber);
  }

  /**
   * Restores a previously saved version
   */
  static async restoreVersion(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
    versionId: string;
  }): Promise<ProjectSectionRecord> {
    const { projectId, userId, promptNumber, versionId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const versions = await this.writerRepo.getSectionVersions(projectId, promptNumber);
    const target = versions.find((v) => v.id === versionId);
    if (!target) throw new Error("VERSION_NOT_FOUND");

    return await this.saveUserEdit({
      projectId,
      userId,
      promptNumber,
      content: target.content,
    });
  }
}
