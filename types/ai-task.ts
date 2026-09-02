import type { AITaskType } from "@/lib/config/ai";

export interface AITaskParameters {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  allowFallback?: boolean;
  [key: string]: unknown;
}

export interface AITaskPayload {
  taskId: string;     // UUID
  projectId: string;  // UUID
  taskType: AITaskType;
  parameters: AITaskParameters;
  knowledgeModules?: string[];
  targetSchemaName?: string;
}

export interface AITaskExecutionResult<T = unknown> {
  taskId: string;
  success: boolean;
  provider: "openai" | "gemini";
  model: string;
  data?: T;
  rawText?: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  error?: {
    code: string;
    message: string;
  };
}
