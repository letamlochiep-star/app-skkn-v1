import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Project Quota Enforcement (Phase 4)", () => {
  const userId = "teacher-quota-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should allow creating 1st project and block 2nd project for TRIAL plan", async () => {
    // 1st project: Allowed
    const project1 = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài 1",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });
    expect(project1.id).toBeDefined();

    // 2nd project: Blocked by quota
    await expect(
      ProjectService.createProject({
        userId,
        payload: {
          documentType: "SKKN",
          workingTitle: "Đề tài 2",
          educationLevel: "SECONDARY",
          subjectGroup: "MATH",
          schoolYear: "2026-2027",
        },
      })
    ).rejects.toThrow();
  });
});
