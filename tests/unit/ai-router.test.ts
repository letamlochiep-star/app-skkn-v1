import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProviderForTask, executeAITask } from "@/lib/ai/router";
import { AI_TASK_TYPES } from "@/lib/config/ai";
import type { AITaskPayload } from "@/types/ai-task";

describe("AI Router Task Mapping & Execution", () => {
  it("should map all supported AI task types to a provider configuration", () => {
    for (const taskType of AI_TASK_TYPES) {
      const route = getProviderForTask(taskType);
      expect(route).toBeDefined();
      expect(route.primaryProvider).toBeDefined();
      expect(route.primaryModel).toBeDefined();
      expect(route.fallbackProvider).toBeDefined();
      expect(route.fallbackModel).toBeDefined();
      expect(route.config.temperature).toBeGreaterThanOrEqual(0);
      expect(route.config.maxTokens).toBeGreaterThan(0);
    }
  });

  it("should return gpt-4o-mini for CLASSIFY and EXTRACT by default", () => {
    const classifyRoute = getProviderForTask("CLASSIFY");
    expect(classifyRoute.primaryModel).toBe("gpt-4o-mini");

    const extractRoute = getProviderForTask("EXTRACT");
    expect(extractRoute.primaryModel).toBe("gpt-4o-mini");
  });

  it("should return gpt-4o for DRAFT and REVIEW by default", () => {
    const draftRoute = getProviderForTask("DRAFT");
    expect(draftRoute.primaryModel).toBe("gpt-4o");

    const reviewRoute = getProviderForTask("REVIEW");
    expect(reviewRoute.primaryModel).toBe("gpt-4o");
  });

  it("should gracefully handle provider failure with structured error reporting", async () => {
    // Calling executeAITask without valid API keys in test environment should return clean error structure
    const task: AITaskPayload = {
      taskId: "test-task-uuid-1",
      projectId: "test-proj-uuid-1",
      taskType: "CLASSIFY",
      parameters: {
        prompt: "Phân loại môn Toán lớp 8",
        allowFallback: false,
      },
    };

    const result = await executeAITask(task);
    expect(result.taskId).toBe("test-task-uuid-1");
    // Since OPENAI_API_KEY is not configured with real live API key in local unit test, it safely returns failure result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
