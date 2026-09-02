import { describe, it, expect } from "vitest";
import { DEFAULT_AI_CONFIG, AI_TASK_TYPES, estimateTokenCost, MODEL_PRICING } from "@/lib/config/ai";

describe("AI Config & Pricing Estimation", () => {
  it("should define all 6 required AI task types", () => {
    expect(AI_TASK_TYPES).toEqual([
      "CLASSIFY",
      "EXTRACT",
      "IDEATE",
      "DRAFT",
      "REVIEW",
      "FINALIZE",
    ]);
  });

  it("should have valid task model configuration for each task type", () => {
    for (const taskType of AI_TASK_TYPES) {
      const config = DEFAULT_AI_CONFIG[taskType];
      expect(config).toBeDefined();
      expect(["openai", "gemini"]).toContain(config.defaultProvider);
      expect(["openai", "gemini"]).toContain(config.fallbackProvider);
      expect(config.primaryModel).toBeTruthy();
      expect(config.fallbackModel).toBeTruthy();
      expect(config.temperature).toBeGreaterThanOrEqual(0);
      expect(config.maxTokens).toBeGreaterThan(0);
    }
  });

  it("should accurately estimate token cost in USD", () => {
    const costGpt4o = estimateTokenCost("gpt-4o", 1000, 2000);
    expect(costGpt4o).toBeGreaterThan(0);

    const costGpt4oMini = estimateTokenCost("gpt-4o-mini", 1000, 2000);
    expect(costGpt4oMini).toBeLessThan(costGpt4o);
  });
});
