import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { DashboardService } from "@/server/services/dashboard-service";
import { UsageService } from "@/server/services/usage-service";

describe("Dashboard Aggregation Service (Phase 4)", () => {
  const userId = "teacher-dash-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should aggregate project counts and recent projects list accurately", async () => {
    // Create 1 project
    await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài gần đây nhất",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const data = await DashboardService.getDashboardData(userId);

    expect(data.projectSummary.total).toBe(1);
    expect(data.projectSummary.active).toBe(1);
    expect(data.recentProjects.length).toBe(1);
    expect(data.recentProjects[0].workingTitle).toBe("Đề tài gần đây nhất");
    expect(data.usage.projects.used).toBe(1);
    expect(data.subscription.isActive).toBe(true);
  });
});
