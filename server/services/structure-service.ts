import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { ProjectSessionService } from "@/server/services/project-session-service";
import { StructurePromptBuilder } from "@/lib/ai/prompts/structure-prompt-builder";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type {
  ProjectStructureRecord,
  StructureSection,
  StructureValidationResult,
} from "@/types/structure";

export class StructureService {
  private static projectRepo = new ProjectRepository();
  private static structureRepo = new StructureRepository();

  /**
   * Retrieves current structure state for a project
   */
  static async getStructureState(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    project: any;
    structure: ProjectStructureRecord | null;
    isLocked: boolean;
  }> {
    const { projectId, userId } = params;
    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (!project.topicLocked) {
      throw new Error("TOPIC_NOT_LOCKED: Dự án cần chốt tên đề tài trước khi xây dựng cấu trúc");
    }

    const structure = await this.structureRepo.findCurrentByProject(projectId);

    return {
      project,
      structure,
      isLocked: project.structureLocked || structure?.status === "LOCKED",
    };
  }

  /**
   * Proposes a complete structure for the project using AI
   */
  static async proposeStructure(params: {
    projectId: string;
    userId: string;
    requestId?: string;
  }): Promise<ProjectStructureRecord> {
    const { projectId, userId, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    if (!project.topicLocked) throw new Error("TOPIC_NOT_LOCKED");

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
      throw new Error("DATA_NOT_READY_FOR_STRUCTURE: Dữ liệu dự án chưa hoàn thiện");
    }

    const rawFacts = await this.projectRepo.getFacts(projectId);
    const verifiedFacts: Record<string, unknown> = {};
    rawFacts.forEach((f) => {
      verifiedFacts[f.key] = f.valueJson;
    });

    // 3. Assemble AI Context
    const builtContext = await buildAIContext({
      taskType: "IDEATE",
      contextInput: {
        subjectGroup: project.subjectGroup as any,
        educationLevel: project.educationLevel as any,
        taskType: "IDEATE",
        workflowStage: "STRUCTURE",
        documentType: project.documentType,
      },
      targetSchemaName: "project-structure",
      userPrompt: `Đề xuất cấu trúc cho đề tài "${project.title || project.workingTitle}"`,
    });

    // 4. Build Structure Prompt
    const { systemPrompt, userPrompt } = StructurePromptBuilder.buildProposeStructurePrompt({
      session: sessionRes.session,
      officialTitle: project.title || project.workingTitle,
      verifiedFacts,
      skillInstructions: builtContext.systemPrompt,
    });

    // 5. Execute via AI Router
    const aiRes = await AIRouter.execute({
      taskType: "IDEATE",
      systemPrompt,
      userPrompt,
      targetSchemaName: "project-structure",
      logicalRequestId: requestId,
    });

    let parsed: { sections: StructureSection[]; coverage: any };
    try {
      parsed = JSON.parse(aiRes.content);
    } catch {
      throw new Error("STRUCTURE_SCHEMA_INVALID: AI không trả về cấu trúc JSON hợp lệ");
    }

    const schemaVal = validateAgainstSchema("project-structure", parsed);
    if (!schemaVal.valid) {
      throw new Error(`STRUCTURE_SCHEMA_INVALID: ${schemaVal.errors.map((e) => e.message).join(", ")}`);
    }

    // 6. Save Proposed Structure
    const structureRecord: ProjectStructureRecord = {
      id: `struct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      version: 1,
      status: "PROPOSED",
      source: "AI_PROPOSED",
      structureJson: parsed.sections,
      dataVersion: 1,
      topicVersion: 1,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.structureRepo.saveStructure(structureRecord);

    // 7. Record AI Usage
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
   * Saves user edits to structure draft
   */
  static async saveStructureDraft(params: {
    projectId: string;
    userId: string;
    sections: StructureSection[];
  }): Promise<ProjectStructureRecord> {
    const { projectId, userId, sections } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    if (project.structureLocked) {
      throw new Error("STRUCTURE_ALREADY_LOCKED: Cấu trúc đã khóa và không thể chỉnh sửa nháp");
    }

    let current = await this.structureRepo.findCurrentByProject(projectId);
    if (!current) {
      current = {
        id: `struct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        version: 1,
        status: "USER_EDITED",
        source: "USER_EDITED",
        structureJson: sections,
        dataVersion: 1,
        topicVersion: 1,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      current.structureJson = sections;
      current.status = "USER_EDITED";
      current.source = "USER_EDITED";
      current.updatedAt = new Date().toISOString();
    }

    return await this.structureRepo.saveStructure(current);
  }

  /**
   * Validates structure coverage and completeness
   */
  static validateStructure(sections: StructureSection[]): StructureValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (sections.length < 3) {
      errors.push("Khung cấu trúc cần có tối thiểu 3 phần chính.");
    }

    const allTitles = sections.map((s) => s.title.toLowerCase());
    const hasIntro = allTitles.some((t) => t.includes("đặt vấn đề") || t.includes("mở đầu") || t.includes("lý do"));
    const hasProblem = allTitles.some((t) => t.includes("thực trạng") || t.includes("cơ sở") || t.includes("hiện trạng"));
    const hasSolution = allTitles.some((t) => t.includes("biện pháp") || t.includes("giải pháp") || t.includes("nội dung"));
    const hasEffect = allTitles.some((t) => t.includes("kết quả") || t.includes("hiệu quả") || t.includes("thực nghiệm"));
    const hasConclusion = allTitles.some((t) => t.includes("kết luận") || t.includes("kiến nghị") || t.includes("đề xuất"));

    if (!hasIntro) warnings.push("Cấu trúc nên có phần Đặt vấn đề / Lý do chọn đề tài.");
    if (!hasSolution) errors.push("Cấu trúc bắt buộc phải có phần Biện pháp / Giải pháp.");
    if (!hasEffect) warnings.push("Cấu trúc nên có phần Đánh giá hiệu quả / Kết quả thực nghiệm.");

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      coverage: {
        topicCovered: hasIntro,
        problemCovered: hasProblem,
        solutionCovered: hasSolution,
        evidenceCovered: hasEffect,
        effectivenessCovered: hasEffect,
        referencesCovered: true,
      },
    };
  }

  /**
   * Locks structure upon user confirmation
   */
  static async lockStructure(params: {
    projectId: string;
    userId: string;
    structureId: string;
    confirmed: boolean;
  }): Promise<ProjectStructureRecord> {
    const { projectId, userId, structureId, confirmed } = params;

    if (!confirmed) {
      throw new Error("STRUCTURE_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận cấu trúc trước khi chốt");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    if (!project.topicLocked) throw new Error("TOPIC_NOT_LOCKED");

    const structure = await this.structureRepo.findCurrentByProject(projectId);
    if (!structure || structure.id !== structureId) {
      throw new Error("STRUCTURE_NOT_FOUND: Không tìm thấy khung cấu trúc");
    }

    const valRes = this.validateStructure(structure.structureJson);
    if (!valRes.valid) {
      throw new Error(`STRUCTURE_INVALID: ${valRes.errors.join(", ")}`);
    }

    // Atomic Lock
    const locked = await this.structureRepo.lockStructure(structureId, projectId, userId);

    await this.projectRepo.update(projectId, userId, {
      structureLocked: true,
    });

    return locked!;
  }
}
