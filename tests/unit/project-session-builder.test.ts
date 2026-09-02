import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ProjectSessionService } from "@/server/services/project-session-service";
import { UsageService } from "@/server/services/usage-service";

describe("Project Session Builder & Schema Validation (Phase 4)", () => {
  const userId = "teacher-session-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should build structured session conforming to skkn-session.schema.json", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên đề tài toán thực tế lớp 8",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        gradeLevel: "Lớp 8",
        schoolYear: "2026-2027",
        problemStatement: "Học sinh gặp khó khăn trong bài toán thực tế.",
        targetGroup: "Học sinh lớp 8A",
        initialGoal: "Nâng cao kết quả học tập.",
      },
    });

    const result = await ProjectSessionService.buildProjectSession(project.id, userId);

    expect(result.valid).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session.currentStep).toBe(1);
    expect(result.session.contextData.subjectGroup).toBe("MATH");
    expect(result.session.contextData.educationLevel).toBe("SECONDARY");
    expect(result.session.contextData.topicTitle).toBe("Tên đề tài toán thực tế lớp 8");
  });
});
