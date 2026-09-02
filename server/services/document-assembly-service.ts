import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import type {
  ProjectDocumentDraftRecord,
  ConsistencyCheckResult,
  ConsistencyConflict,
} from "@/types/writer";

export class DocumentAssemblyService {
  private static projectRepo = new ProjectRepository();
  private static structureRepo = new StructureRepository();
  private static writerRepo = new WriterRepository();

  /**
   * Assembles all completed sections into a single comprehensive draft in locked structure order
   */
  static async assembleDraftDocument(params: {
    projectId: string;
    userId: string;
  }): Promise<ProjectDocumentDraftRecord> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const structure = await this.structureRepo.findCurrentByProject(projectId);
    if (!structure) throw new Error("STRUCTURE_NOT_FOUND");

    const sections = await this.writerRepo.findSectionsByProject(projectId);

    // Build assembled plain text and structured JSON
    const contentJson: any[] = [];
    const plainTextParts: string[] = [];

    plainTextParts.push(`BÁO CÁO KẾT QUẢ ĐỀ TÀI: ${project.title?.toUpperCase() || project.workingTitle?.toUpperCase()}`);
    plainTextParts.push(`Đơn vị: ${project.schoolName || "[Chờ cập nhật tên đơn vị]"}`);
    plainTextParts.push(`Năm học: ${project.schoolYear || "2026-2027"}\n`);

    sections.forEach((sec) => {
      contentJson.push({
        promptNumber: sec.promptNumber,
        title: sec.title,
        content: sec.content,
        status: sec.status,
      });

      plainTextParts.push(`=== ${sec.title.toUpperCase()} ===`);
      plainTextParts.push(sec.content);
      plainTextParts.push("\n");
    });

    const fullPlainText = plainTextParts.join("\n");

    // Calculate placeholder occurrences
    const realDataPlaceholders = (fullPlainText.match(/\[CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN\]/g) || []).length +
      (fullPlainText.match(/\[CHỜ DỮ LIỆU THỰC TỪ GIÁO VIÊN\]/g) || []).length;
    const evidencePlaceholders = (fullPlainText.match(/\[CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN\]/g) || []).length;
    const referencePlaceholders = (fullPlainText.match(/\[NGUỒN CẦN XÁC MINH\]/g) || []).length;

    const draftRecord: ProjectDocumentDraftRecord = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      version: 1,
      contentJson,
      plainText: fullPlainText,
      status: "DRAFT",
      placeholderSummary: {
        realDataPlaceholders,
        evidencePlaceholders,
        referencePlaceholders,
      },
      dataVersion: 1,
      structureVersion: 1,
      promptSetVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.writerRepo.saveDocumentDraft(draftRecord);
  }

  /**
   * Performs technical consistency check across the assembled draft
   */
  static async checkDraftConsistency(params: {
    projectId: string;
    userId: string;
  }): Promise<ConsistencyCheckResult> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const rawFacts = await this.projectRepo.getFacts(projectId);
    const verifiedFacts: Record<string, unknown> = {};
    rawFacts.forEach((f) => {
      verifiedFacts[f.key] = f.valueJson;
    });

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    const plainText = draft?.plainText || "";

    const conflicts: ConsistencyConflict[] = [];

    // 1. Student Count Check
    const expCount = Number(verifiedFacts["experimental_student_count"]);
    if (expCount) {
      const matches = plainText.match(/(\d{2,3})\s*(học sinh|em học sinh|hs|em)/gi);
      if (matches) {
        for (const m of matches) {
          const num = Number(m.match(/\d+/)?.[0]);
          if (num && num !== expCount && Math.abs(num - expCount) > 1) {
            conflicts.push({
              type: "STUDENT_COUNT_MISMATCH",
              message: `Phát hiện mâu thuẫn sĩ số: Số liệu xác minh là ${expCount}, nhưng văn bản xuất hiện '${m}'.`,
              severity: "WARNING",
            });
          }
        }
      }
    }

    // 2. School Year Check
    const schoolYear = project.schoolYear || "2026-2027";
    const yearMatches = plainText.match(/năm học \d{4}-\d{4}/gi);
    if (yearMatches) {
      for (const ym of yearMatches) {
        if (!ym.includes(schoolYear)) {
          conflicts.push({
            type: "SCHOOL_YEAR_MISMATCH",
            message: `Phát hiện mâu thuẫn năm học: Năm học dự án là ${schoolYear}, nhưng văn bản có '${ym}'.`,
            severity: "WARNING",
          });
        }
      }
    }

    const realDataPlaceholders = (plainText.match(/\[CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN\]/g) || []).length +
      (plainText.match(/\[CHỜ DỮ LIỆU THỰC TỪ GIÁO VIÊN\]/g) || []).length;
    const evidencePlaceholders = (plainText.match(/\[CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN\]/g) || []).length;
    const referencePlaceholders = (plainText.match(/\[NGUỒN CẦN XÁC MINH\]/g) || []).length;

    return {
      valid: conflicts.filter((c) => c.severity === "BLOCKING").length === 0,
      conflicts,
      placeholderSummary: {
        realDataPlaceholders,
        evidencePlaceholders,
        referencePlaceholders,
      },
    };
  }
}
