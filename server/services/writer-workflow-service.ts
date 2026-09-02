import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { DocumentAssemblyService } from "@/server/services/document-assembly-service";
import type { ProjectRecord } from "@/types/project";

export class WriterWorkflowService {
  private static projectRepo = new ProjectRepository();
  private static writerRepo = new WriterRepository();

  /**
   * Assesses readiness of writer stage to complete
   */
  static async getWriterReadiness(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    ready: boolean;
    sectionsCount: number;
    prompt18Complete: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const sections = await this.writerRepo.findSectionsByProject(projectId);
    const validSections = sections.filter((s) => s.content.trim().length > 0);

    const prompt18 = sections.find((s) => s.promptNumber === 18 && s.content.trim().length > 0);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (validSections.length < 18) {
      warnings.push(`Còn ${18 - validSections.length} phần chưa hoàn thành nội dung.`);
    }

    if (!prompt18) {
      errors.push("Chưa hoàn thành câu lệnh số 18 (Tổng hợp toàn văn và rà soát tài liệu tham khảo).");
    }

    return {
      ready: errors.length === 0,
      sectionsCount: validSections.length,
      prompt18Complete: Boolean(prompt18),
      errors,
      warnings,
    };
  }

  /**
   * Completes Phase 7 Writer Stage and transitions project to REVIEW stage (Step 5 / 6)
   * Atomic server-side operation, no AI quota charge
   */
  static async completeWriterStage(params: {
    projectId: string;
    userId: string;
    confirmed: boolean;
  }): Promise<ProjectRecord> {
    const { projectId, userId, confirmed } = params;

    if (!confirmed) {
      throw new Error("WRITER_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận đã kiểm tra bản thảo trước khi chuyển sang bước rà soát");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const readiness = await this.getWriterReadiness({ projectId, userId });
    if (!readiness.ready) {
      throw new Error(`WRITER_NOT_READY: ${readiness.errors.join("; ")}`);
    }

    // Assemble and verify draft
    const draft = await DocumentAssemblyService.assembleDraftDocument({ projectId, userId });
    await DocumentAssemblyService.checkDraftConsistency({ projectId, userId });

    draft.status = "READY_FOR_REVIEW";
    await this.writerRepo.saveDocumentDraft(draft);

    // Atomic transition to REVIEW stage (90%)
    const updated = await this.projectRepo.update(projectId, userId, {
      workflowStage: "REVIEW",
      progressPercent: 90,
    });

    return updated;
  }
}
