import { describe, it, expect, beforeEach } from "vitest";
import { TopicService } from "@/server/services/topic-service";
import { ProjectService } from "@/server/services/project-service";
import { TopicInputService } from "@/server/services/topic-input-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Missing Data Detection (Phase 5)", () => {
  const userId = "teacher-missing-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should recognize known facts and flag missing problemStatement as not ready", async () => {
    // Create project with missing problemStatement
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        gradeLevel: "Lớp 8",
        schoolYear: "2026-2027",
      },
    });

    const status = await TopicInputService.getTopicInputStatus(project.id, userId);

    expect(status.known.subjectGroup).toBe("MATH");
    expect(status.known.educationLevel).toBe("SECONDARY");
    expect(status.readyForSuggestion).toBe(false);
    expect(status.missing.some((m) => m.key === "problem_statement")).toBe(true);

    // Calling suggestTopics should reject with TOPIC_NOT_READY
    await expect(
      TopicService.suggestTopics({
        projectId: project.id,
        userId,
      })
    ).rejects.toThrow("TOPIC_NOT_READY");
  });
});
