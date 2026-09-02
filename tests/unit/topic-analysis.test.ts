import { describe, it, expect, beforeEach, vi } from "vitest";
import { TopicService } from "@/server/services/topic-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { TopicRepository } from "@/server/repositories/topic-repository";
import { UsageService } from "@/server/services/usage-service";
import { AIRouter } from "@/lib/ai/router";

describe("Topic Analysis (Branch A - Phase 5)", () => {
  const userId = "teacher-topic-ana-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    TopicRepository.clearMemoryTopicStore();
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should analyze title, evaluate 8 criteria, and produce max 3 suggestions matching schema", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Dạy toán thực tế lớp 8",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        gradeLevel: "Lớp 8",
        schoolYear: "2026-2027",
        problemStatement: "Học sinh gặp khó khăn trong việc vận dụng kiến thức toán học vào thực tiễn.",
      },
    });

    const mockAnalysisOutput = {
      action: "analyze_topic",
      analysis: {
        object: { status: "GOOD", comment: "Đối tượng học sinh lớp 8 rõ ràng." },
        problem: { status: "GOOD", comment: "Vấn đề kỹ năng thực tế xác đáng." },
        intervention: { status: "NEEDS_CLARIFICATION", comment: "Cần làm rõ phương pháp sư phạm áp dụng." },
        scope: { status: "GOOD", comment: "Phạm vi môn Toán THCS phù hợp." },
        clarity: { status: "GOOD", comment: "Tên dễ hiểu." },
        novelty: { status: "NEEDS_CLARIFICATION", comment: "Cần nhấn mạnh bối cảnh chương trình GDPT 2018." },
        measurability: { status: "GOOD", comment: "Có thể đánh giá qua bài kiểm tra và sản phẩm thực tế." },
        evidenceFeasibility: { status: "GOOD", comment: "Dễ thu thập phiếu học tập và bài làm học sinh." },
      },
      strengths: ["Xác định đúng đối tượng", "Phù hợp chương trình THCS"],
      needsRevision: ["Nên bổ sung biện pháp cụ thể như dạy học trải nghiệm hoặc mô hình hóa"],
      suggestions: [
        {
          title: "Biện pháp rèn luyện kỹ năng giải bài toán thực tiễn cho học sinh lớp 8 trong môn Toán",
          direction: "SAFE",
          rationale: "Chuẩn thể thức, rõ biện pháp và đối tượng",
          evidenceFeasibility: "Thu thập qua bài kiểm tra định kỳ",
        },
        {
          title: "Vận dụng mô hình hóa toán học nhằm nâng cao năng lực giải quyết vấn đề cho học sinh lớp 8",
          direction: "INTERVENTION_FOCUS",
          rationale: "Làm rõ giải pháp mô hình hóa toán học",
          evidenceFeasibility: "Thu thập qua phiếu học tập nhóm",
        },
      ],
    };

    vi.spyOn(AIRouter, "execute").mockResolvedValue({
      content: JSON.stringify(mockAnalysisOutput),
      provider: "openai",
      model: "gpt-4o",
      tokenUsage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
      latencyMs: 300,
      requestId: "mock-req-1",
    });

    const result = await TopicService.analyzeTopic({
      projectId: project.id,
      userId,
      title: "Dạy toán thực tế lớp 8",
    });

    expect(result.analysis.action).toBe("analyze_topic");
    expect(result.analysis.suggestions.length).toBeLessThanOrEqual(3);
    expect(result.candidates.length).toBe(2);
    expect(result.candidates[0].title).toContain("Biện pháp rèn luyện");
  });
});
