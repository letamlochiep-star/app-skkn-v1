import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import type { ProjectDocumentDraftRecord } from "@/types/writer";
import type { ProjectReviewRunRecord } from "@/types/review";
import type { DefenseDuration } from "@/types/defense";

export class DefenseContextBuilder {
  private static projectRepo = new ProjectRepository();
  private static writerRepo = new WriterRepository();
  private static reviewRepo = new ReviewerRepository();

  /**
   * Builds context for defense presentation generation
   */
  static async buildDefenseContext(params: {
    projectId: string;
    userId: string;
    durationMinutes?: DefenseDuration;
  }): Promise<{
    project: any;
    draft: ProjectDocumentDraftRecord;
    reviewRun: ProjectReviewRunRecord;
    verifiedFacts: Record<string, unknown>;
    durationMinutes: DefenseDuration;
  }> {
    const { projectId, userId, durationMinutes = 7 } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.documentType !== "SOLUTION") {
      throw new Error("DEFENSE_PRESENTATION_NOT_ENABLED_FOR_DOCUMENT_TYPE: Báo cáo bảo vệ trước BGK chỉ áp dụng cho đề tài Giải pháp hữu ích");
    }

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    if (!draft || !draft.plainText || draft.plainText.trim().length === 0) {
      throw new Error("DOCUMENT_NOT_READY: Chưa có bản thảo toàn văn");
    }

    const reviewRun = await this.reviewRepo.findLatestReviewRun(projectId);
    if (!reviewRun || reviewRun.status === "FAILED") {
      throw new Error("REVIEW_REQUIRED: Dự án cần hoàn thành bước rà soát AI Reviewer trước khi tạo báo cáo bảo vệ");
    }

    const rawFacts = await this.projectRepo.getFacts(projectId);
    const verifiedFacts: Record<string, unknown> = {
      school_name: project.schoolName,
      education_level: project.educationLevel,
      subject_group: project.subjectGroup,
      grade_level: project.gradeLevel,
      school_year: project.schoolYear,
    };

    rawFacts.forEach((f) => {
      if (f.verified) {
        verifiedFacts[f.key] = f.valueJson;
      }
    });

    return {
      project,
      draft,
      reviewRun,
      verifiedFacts,
      durationMinutes,
    };
  }
}
