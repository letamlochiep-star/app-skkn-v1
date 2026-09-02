import { describe, it, expect, beforeEach, vi } from "vitest";
import { TopicService } from "@/server/services/topic-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { TopicRepository } from "@/server/repositories/topic-repository";
import { UsageService } from "@/server/services/usage-service";
import { AIRouter } from "@/lib/ai/router";

describe("Topic AI Quota & Idempotency (Phase 5)", () => {
  const userId = "teacher-topic-quota";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    TopicRepository.clearMemoryTopicStore();
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should charge 1 AI request and remain idempotent on same requestId", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
        problemStatement: "Học sinh còn yếu trong kỹ năng vận dụng thực tế.",
      },
    });

    const mockOutput = {
      action: "suggest_topics",
      topics: [
        { title: "Đề tài 1", rationale: "R1", strengths: ["S1"], evidenceFeasibility: "E1", notes: "N1" },
        { title: "Đề tài 2", rationale: "R2", strengths: ["S2"], evidenceFeasibility: "E2", notes: "N2" },
        { title: "Đề tài 3", rationale: "R3", strengths: ["S3"], evidenceFeasibility: "E3", notes: "N3" },
        { title: "Đề tài 4", rationale: "R4", strengths: ["S4"], evidenceFeasibility: "E4", notes: "N4" },
        { title: "Đề tài 5", rationale: "R5", strengths: ["S5"], evidenceFeasibility: "E5", notes: "N5" },
      ],
      recommendedIndex: 0,
      recommendationReason: "Khuyến nghị phương án 1",
    };

    vi.spyOn(AIRouter, "execute").mockResolvedValue({
      content: JSON.stringify(mockOutput),
      provider: "openai",
      model: "gpt-4o",
      tokenUsage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
      latencyMs: 300,
      requestId: "mock-quota-req",
    });

    const requestId = "idemp-req-12345";

    // 1st call
    await TopicService.suggestTopics({
      projectId: project.id,
      userId,
      requestId,
    });

    const usageAfter1st = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(usageAfter1st).toBe(1);

    // 2nd call with same requestId (idempotent replay)
    await TopicService.suggestTopics({
      projectId: project.id,
      userId,
      requestId,
    });

    const usageAfter2nd = await UsageService.getFeatureUsage(userId, "AI_GENERATE");
    expect(usageAfter2nd).toBe(1); // Does not double-charge
  });
});
