/**
 * AI Task and Provider Configuration
 */

export const AI_TASK_TYPES = [
  "CLASSIFY",
  "EXTRACT",
  "IDEATE",
  "DRAFT",
  "REVIEW",
  "FINALIZE",
] as const;

export type AITaskType = (typeof AI_TASK_TYPES)[number];

export interface TaskModelConfig {
  defaultProvider: "openai" | "gemini";
  primaryModel: string;
  fallbackProvider: "openai" | "gemini";
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_AI_CONFIG: Record<AITaskType, TaskModelConfig> = {
  CLASSIFY: {
    defaultProvider: "openai",
    primaryModel: "gpt-4o-mini",
    fallbackProvider: "gemini",
    fallbackModel: "gemini-1.5-flash",
    temperature: 0.1,
    maxTokens: 1000,
  },
  EXTRACT: {
    defaultProvider: "openai",
    primaryModel: "gpt-4o-mini",
    fallbackProvider: "gemini",
    fallbackModel: "gemini-1.5-flash",
    temperature: 0.2,
    maxTokens: 2500,
  },
  IDEATE: {
    defaultProvider: "openai",
    primaryModel: "gpt-4o",
    fallbackProvider: "gemini",
    fallbackModel: "gemini-1.5-pro",
    temperature: 0.7,
    maxTokens: 3000,
  },
  DRAFT: {
    defaultProvider: "openai",
    primaryModel: "gpt-4o",
    fallbackProvider: "gemini",
    fallbackModel: "gemini-1.5-pro",
    temperature: 0.4,
    maxTokens: 4096,
  },
  REVIEW: {
    defaultProvider: "openai",
    primaryModel: "gpt-4o",
    fallbackProvider: "gemini",
    fallbackModel: "gemini-1.5-pro",
    temperature: 0.2,
    maxTokens: 3000,
  },
  FINALIZE: {
    defaultProvider: "openai",
    primaryModel: "gpt-4o",
    fallbackProvider: "gemini",
    fallbackModel: "gemini-1.5-flash",
    temperature: 0.1,
    maxTokens: 4096,
  },
};

/**
 * Token Pricing Estimator (USD per 1M tokens)
 */
export const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  "gpt-4o": { inputPer1M: 5.0, outputPer1M: 15.0 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gemini-1.5-pro": { inputPer1M: 3.5, outputPer1M: 10.5 },
  "gemini-1.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
};

/**
 * Helper to calculate estimated cost in USD
 */
export function estimateTokenCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { inputPer1M: 1.0, outputPer1M: 2.0 };
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  return Number((inputCost + outputCost).toFixed(6));
}
