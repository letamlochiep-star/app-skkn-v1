import { ProjectRepository } from "@/server/repositories/project-repository";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { SubscriptionService } from "@/server/services/subscription-service";
import { UsageService } from "@/server/services/usage-service";
import type { ProjectRecord } from "@/types/project";
import type { UsageSummary } from "@/types/entitlement";

export interface DashboardData {
  profile: {
    fullName: string;
    educationLevel: string;
    subjectGroup: string;
  };
  projectSummary: {
    total: number;
    active: number;
    completed: number;
    archived: number;
  };
  recentProjects: ProjectRecord[];
  subscription: {
    planName: string;
    isActive: boolean;
    isTrial: boolean;
    remainingDays: string;
  };
  usage: UsageSummary;
}

export class DashboardService {
  private static projectRepo = new ProjectRepository();
  private static profileRepo = new ProfileRepository();

  /**
   * Aggregates full dashboard overview for a user in a single cohesive call
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const profile = await this.profileRepo.findById(userId);
    const subStatus = await SubscriptionService.getSubscriptionStatus(userId);
    const plan = await SubscriptionService.getCurrentPlan(userId);
    const usage = await UsageService.getUsageSummary(userId);

    const { items: allProjects, total } = await this.projectRepo.listByUser(userId, {
      limit: 100,
    });

    const activeCount = allProjects.filter((p) => p.status === "ACTIVE" || p.status === "DRAFT").length;
    const completedCount = allProjects.filter((p) => p.status === "COMPLETED").length;
    const archivedCount = allProjects.filter((p) => p.status === "ARCHIVED").length;

    const recentProjects = allProjects.slice(0, 5);

    return {
      profile: {
        fullName: profile?.fullName || "Quý Thầy/Cô",
        educationLevel: profile?.educationLevel || "THCS",
        subjectGroup: profile?.subjectGroup || "Toán học",
      },
      projectSummary: {
        total,
        active: activeCount,
        completed: completedCount,
        archived: archivedCount,
      },
      recentProjects,
      subscription: {
        planName: plan.name,
        isActive: subStatus.isActive,
        isTrial: subStatus.trialStatus.isTrial,
        remainingDays: subStatus.trialStatus.formattedRemaining,
      },
      usage,
    };
  }
}
