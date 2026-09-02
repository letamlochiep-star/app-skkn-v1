import { describe, it, expect, beforeEach, vi } from "vitest";
import { TopicService } from "@/server/services/topic-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { TopicRepository } from "@/server/repositories/topic-repository";
import { UsageService } from "@/server/services/usage-service";
import { AIRouter } from "@/lib/ai/router";

describe("Topic Suggestions (Branch B - Phase 5)", () => {
  const userId = "teacher-topic-sug-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    TopicRepository.clearMemoryTopicStore();
    UsageService.clearMemoryLedger();
    vi.restoreAllMocks();
  });

  it("should generate exactly 5 topic candidates with 1 recommendation", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Tên dự án tạm",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        gradeLevel: "Lớp 8",
        schoolYear: "2026-2027",
        problemStatement: "Học sinh còn thụ động trong giải toán hình học không gian.",
      },
    });

    const mockSuggestionsOutput = {
      action: "suggest_topics",
      topics: [
        {
          title: "Biện pháp sử dụng phần mềm hình học động GeoGebra nhằm nâng cao khả năng trực quan cho học sinh lớp 8",
          rationale: "Khai thác trực quan hình học",
          strengths: ["Ứng dụng công nghệ hiệu quả", "Phù hợp chương trình"],
          evidenceFeasibility: "Sản phẩm thực hành trên máy",
          notes: "Rất phù hợp bài hình học",
        },
        {
          title: "Vận dụng phương pháp dạy học khám phá trong dạy học hình học 8",
          rationale: "Tăng tính chủ động",
          strengths: ["Phương pháp sư phạm chuẩn"],
          evidenceFeasibility: "Phiếu học tập và quan sát lớp",
          notes: "Dễ triển khai",
        },
        {
          title: "Rèn luyện kỹ năng phân tích và chứng minh hình học cho học sinh lớp 8",
          rationale: "Khắc phục triệt để lỗi lập luận",
          strengths: ["Trọng tâm môn học"],
          evidenceFeasibility: "Bài kiểm tra thường xuyên",
          notes: "Phương án an toàn",
        },
        {
          title: "Xây dựng hệ thống bài tập thực hành gắn với đời sống trong chương Hình học 8",
          rationale: "Gắn liền thực tiễn",
          strengths: ["Tính ứng dụng cao"],
          evidenceFeasibility: "Bộ bài tập và bài làm của trò",
          notes: "Khả thi cao",
        },
        {
          title: "Đổi mới tổ chức hoạt động nhóm trong giải toán hình học lớp 8",
          rationale: "Tăng tương tác",
          strengths: ["Phát triển năng lực giao tiếp hợp tác"],
          evidenceFeasibility: "Biên bản làm việc nhóm",
          notes: "Dễ áp dụng",
        },
      ],
      recommendedIndex: 0,
      recommendationReason: "Phương án 1 kết hợp hiệu quả trực quan công nghệ và phù hợp nhất với bối cảnh GDPT 2018.",
    };

    vi.spyOn(AIRouter, "execute").mockResolvedValue({
      content: JSON.stringify(mockSuggestionsOutput),
      provider: "openai",
      model: "gpt-4o",
      tokenUsage: { promptTokens: 120, completionTokens: 150, totalTokens: 270 },
      latencyMs: 400,
      requestId: "mock-sug-req",
    });

    const result = await TopicService.suggestTopics({
      projectId: project.id,
      userId,
    });

    expect(result.suggestions.topics.length).toBe(5);
    expect(result.suggestions.recommendedIndex).toBe(0);
    expect(result.candidates.length).toBe(5);
    expect(result.candidates[0].rank).toBe(1);
  });
});
