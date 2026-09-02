import { ProjectRepository } from "@/server/repositories/project-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import type { ProjectRecord } from "@/types/project";

export class ReviewWorkflowService {
  private static projectRepo = new ProjectRepository();
  private static reviewRepo = new ReviewerRepository();

  /**
   * Evaluates readiness to complete review stage
   */
  static async getReviewReadiness(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    ready: boolean;
    unresolvedBlockers: number;
    errors: string[];
  }> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const latestRun = await this.reviewRepo.findLatestReviewRun(projectId);
    if (!latestRun) {
      return {
        ready: false,
        unresolvedBlockers: 0,
        errors: ["Chưa thực hiện rà soát toàn bài (AI Reviewer) cho bản thảo."],
      };
    }

    const findings = await this.reviewRepo.findFindingsByRun(latestRun.id);
    const blockers = findings.filter(
      (f) => f.severity === "BLOCKING" && (f.status === "OPEN" || f.status === "ACCEPTED")
    );

    const errors: string[] = [];
    if (blockers.length > 0) {
      errors.push(`Còn ${blockers.length} lỗi bắt buộc (BLOCKING) chưa được giải quyết.`);
    }

    return {
      ready: errors.length === 0,
      unresolvedBlockers: blockers.length,
      errors,
    };
  }

  /**
   * Completes Review stage and transitions project to FINALIZE stage (Step 6 / 6 - 100%)
   * Atomic server-side operation, no AI quota charge
   */
  static async completeReviewStage(params: {
    projectId: string;
    userId: string;
    confirmed: boolean;
  }): Promise<ProjectRecord> {
    const { projectId, userId, confirmed } = params;

    if (!confirmed) {
      throw new Error("REVIEW_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận đã rà soát trước khi chuyển sang bước hoàn thiện");
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const readiness = await this.getReviewReadiness({ projectId, userId });
    if (!readiness.ready) {
      throw new Error(`REVIEW_NOT_READY: ${readiness.errors.join("; ")}`);
    }

    // Atomic transition to FINALIZE stage (100%)
    const updated = await this.projectRepo.update(projectId, userId, {
      workflowStage: "FINALIZE",
      progressPercent: 100,
    });

    return updated;
  }
}
