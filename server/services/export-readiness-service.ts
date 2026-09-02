import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import type { ExportType, ExportMode, ExportReadiness } from "@/types/export";

export class ExportReadinessService {
  private static projectRepo = new ProjectRepository();
  private static writerRepo = new WriterRepository();
  private static reviewRepo = new ReviewerRepository();
  private static defenseRepo = new DefenseRepository();

  /**
   * Evaluates readiness for a given export product
   */
  static async getReadiness(params: {
    projectId: string;
    userId: string;
    exportType: ExportType;
    mode?: ExportMode;
  }): Promise<ExportReadiness> {
    const { projectId, userId, exportType, mode = "FINAL" } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    const review = await this.reviewRepo.findLatestReviewRun(projectId);
    const defense = await this.defenseRepo.findLatestPackage(projectId);

    const blockers: string[] = [];
    const warnings: string[] = [];

    const sourceVersions = {
      documentVersion: draft?.version || 1,
      reviewVersion: review?.reviewVersion || 1,
      defenseVersion: defense?.version || 1,
      dataVersion: draft?.dataVersion || 1,
      structureVersion: draft?.structureVersion || 1,
    };

    // 1. Matrix Check
    if (project.documentType === "SKKN" && (exportType === "DEFENSE_PPTX" || exportType === "ONE_PAGE_PDF")) {
      blockers.push(`Sản phẩm ${exportType} chỉ áp dụng cho đề tài Giải pháp hữu ích`);
      return { allowed: false, status: "BLOCKED", blockers, warnings, sourceVersions };
    }

    // 2. Document readiness for DOCX / PDF
    if (exportType === "DOCX" || exportType === "FULL_PDF") {
      if (!draft || !draft.plainText || draft.plainText.trim().length === 0) {
        blockers.push("Chưa có bản thảo toàn văn");
      }

      if (mode === "FINAL") {
        if (!review || review.status === "FAILED") {
          blockers.push("Bản thảo chưa hoàn thành bước rà soát AI Reviewer");
        }
        if (draft && review && draft.version > review.documentVersion) {
          blockers.push("Bản thảo đã thay đổi sau lần rà soát gần nhất (Review bị cũ)");
        }
        if (draft?.placeholderSummary) {
          const totalPh =
            (draft.placeholderSummary.realDataPlaceholders || 0) +
            (draft.placeholderSummary.evidencePlaceholders || 0) +
            (draft.placeholderSummary.referencePlaceholders || 0);
          if (totalPh > 0) {
            blockers.push(`Bản thảo còn ${totalPh} vị trí placeholder chưa hoàn thiện`);
          }
        }
      } else {
        // DRAFT mode warnings
        if (draft?.placeholderSummary) {
          const totalPh =
            (draft.placeholderSummary.realDataPlaceholders || 0) +
            (draft.placeholderSummary.evidencePlaceholders || 0) +
            (draft.placeholderSummary.referencePlaceholders || 0);
          if (totalPh > 0) {
            warnings.push(`Bản nháp còn ${totalPh} placeholder`);
          }
        }
      }
    }

    // 3. Defense readiness for PPTX / ONE_PAGE_PDF
    if (exportType === "DEFENSE_PPTX" || exportType === "ONE_PAGE_PDF") {
      if (!defense) {
        blockers.push("Chưa khởi tạo gói báo cáo bảo vệ trước Ban Giám Khảo (Phase 9)");
      } else {
        if (defense.status !== "COMPLETED" && mode === "FINAL") {
          blockers.push("Gói báo cáo bảo vệ chưa được Thầy/Cô xác nhận hoàn thành");
        }
        if (draft && draft.version > defense.sourceDocumentVersion) {
          blockers.push("Bản thảo tài liệu đã thay đổi sau khi tạo gói bảo vệ");
        }
      }
    }

    const allowed = blockers.length === 0;
    const status: ExportReadiness["status"] = !allowed
      ? "BLOCKED"
      : warnings.length > 0
      ? "READY_WITH_WARNINGS"
      : "READY";

    return {
      allowed,
      status,
      blockers,
      warnings,
      sourceVersions,
    };
  }
}
