import { describe, it, expect, beforeEach } from "vitest";
import { TopicService } from "@/server/services/topic-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { TopicRepository } from "@/server/repositories/topic-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Topic Confirmation & Atomic Lock (Phase 5)", () => {
  const userA = "teacher-lock-A";
  const userB = "teacher-lock-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    TopicRepository.clearMemoryTopicStore();
    UsageService.clearMemoryLedger();
  });

  it("should enforce user confirmation before locking topic", async () => {
    const project = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    // Unconfirmed lock attempt: should fail
    await expect(
      TopicService.lockTopic({
        projectId: project.id,
        userId: userA,
        finalTitle: "Tên đề tài chính thức",
        confirmed: false,
      })
    ).rejects.toThrow("TOPIC_CONFIRMATION_REQUIRED");
  });

  it("should atomically lock topic, transition workflow stage to DATA, and not charge AI quota", async () => {
    const project = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const lockedProject = await TopicService.lockTopic({
      projectId: project.id,
      userId: userA,
      finalTitle: "Biện pháp rèn luyện kỹ năng giải bài toán thực tiễn cho học sinh lớp 8",
      confirmed: true,
    });

    expect(lockedProject.title).toBe("Biện pháp rèn luyện kỹ năng giải bài toán thực tiễn cho học sinh lớp 8");
    expect(lockedProject.topicLocked).toBe(true);
    expect(lockedProject.workflowStage).toBe("DATA");
    expect(lockedProject.progressPercent).toBe(30);

    // Verify AI quota was not charged for lock
    const aiUsage = await UsageService.getFeatureUsage(userA, "AI_GENERATE");
    expect(aiUsage).toBe(0);
  });

  it("should prevent User B from locking User A's project", async () => {
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    await expect(
      TopicService.lockTopic({
        projectId: projectA.id,
        userId: userB,
        finalTitle: "Tên xâm nhập",
        confirmed: true,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
