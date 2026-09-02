import { OpenAIProvider } from "./providers/openai-provider";
import { GeminiProvider } from "./providers/gemini-provider";
import { DEFAULT_AI_CONFIG, type AITaskType, type TaskModelConfig } from "../config/ai";
import { validateAgainstSchema } from "../validation/json-schema-validator";
import { logAIUsage } from "@/server/services/ai-usage-service";
import type { AIProvider } from "./types";
import type { AITaskPayload, AITaskExecutionResult } from "@/types/ai-task";

// Singletons for providers
const openaiProvider = new OpenAIProvider();
const geminiProvider = new GeminiProvider();

const providerRegistry: Record<"openai" | "gemini", AIProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
};

export interface TaskRouteInfo {
  primaryProvider: AIProvider;
  primaryModel: string;
  fallbackProvider: AIProvider;
  fallbackModel: string;
  config: TaskModelConfig;
}

/**
 * Returns provider and model mappings for a given task type.
 */
export function getProviderForTask(taskType: AITaskType): TaskRouteInfo {
  const config = DEFAULT_AI_CONFIG[taskType] || DEFAULT_AI_CONFIG.DRAFT;

  // Allow environment overrides for models
  const primaryModel =
    taskType === "CLASSIFY" ? process.env.AI_CLASSIFY_MODEL || config.primaryModel :
    taskType === "EXTRACT" ? process.env.AI_EXTRACT_MODEL || config.primaryModel :
    taskType === "REVIEW" ? process.env.AI_REVIEW_MODEL || config.primaryModel :
    taskType === "FINALIZE" ? process.env.AI_FINALIZE_MODEL || config.primaryModel :
    process.env.AI_DRAFT_MODEL || config.primaryModel;

  return {
    primaryProvider: providerRegistry[config.defaultProvider],
    primaryModel,
    fallbackProvider: providerRegistry[config.fallbackProvider],
    fallbackModel: config.fallbackModel,
    config,
  };
}

/**
 * Class-based AIRouter abstraction for high-level operations with fallback and structured schemas
 */
export class AIRouter {
  static async execute(params: {
    taskType: AITaskType;
    systemPrompt: string;
    userPrompt: string;
    targetSchemaName?: string;
    logicalRequestId?: string;
  }): Promise<{
    content: string;
    provider: string;
    model: string;
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
    latencyMs: number;
    requestId: string;
  }> {
    const route = getProviderForTask(params.taskType);
    const start = Date.now();
    let content = "";
    let providerName: string = route.config.defaultProvider;
    let modelName: string = route.primaryModel;

    try {
      if (params.targetSchemaName) {
        const data = await route.primaryProvider.generateStructured({
          prompt: params.userPrompt,
          systemPrompt: params.systemPrompt,
          model: route.primaryModel,
        });
        content = typeof data === "string" ? data : JSON.stringify(data);
      } else {
        const res = await route.primaryProvider.generateText({
          prompt: params.userPrompt,
          systemPrompt: params.systemPrompt,
          model: route.primaryModel,
        });
        content = res.text;
      }
    } catch (primaryErr) {
      if (route.fallbackProvider) {
        providerName = route.config.fallbackProvider;
        modelName = route.fallbackModel;
        if (params.targetSchemaName) {
          const data = await route.fallbackProvider.generateStructured({
            prompt: params.userPrompt,
            systemPrompt: params.systemPrompt,
            model: route.fallbackModel,
          });
          content = typeof data === "string" ? data : JSON.stringify(data);
        } else {
          const res = await route.fallbackProvider.generateText({
            prompt: params.userPrompt,
            systemPrompt: params.systemPrompt,
            model: route.fallbackModel,
          });
          content = res.text;
        }
      } else {
        throw primaryErr;
      }
    }

    const latencyMs = Date.now() - start;
    return {
      content,
      provider: providerName,
      model: modelName,
      tokenUsage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
      latencyMs,
      requestId: params.logicalRequestId || `req_${Date.now()}`,
    };
  }
}

/**
 * Executes an AI task with automatic fallback, validation, and usage logging.
 */
export async function executeAITask<T = unknown>(
  task: AITaskPayload
): Promise<AITaskExecutionResult<T>> {
  const startTime = Date.now();
  const route = getProviderForTask(task.taskType);
  const allowFallback = task.parameters.allowFallback !== false;

  let usedProvider: "openai" | "gemini" = route.config.defaultProvider;
  let usedModel: string = route.primaryModel;
  let isFallback = false;
  let lastError: Error | null = null;
  let outputData: T | undefined = undefined;
  let rawText = "";

  // 1. Attempt with Primary Provider
  try {
    if (task.targetSchemaName) {
      outputData = await route.primaryProvider.generateStructured<T>({
        prompt: task.parameters.prompt,
        systemPrompt: task.parameters.systemPrompt,
        model: route.primaryModel,
        temperature: task.parameters.temperature ?? route.config.temperature,
        maxTokens: task.parameters.maxTokens ?? route.config.maxTokens,
      });
    } else {
      const textResult = await route.primaryProvider.generateText({
        prompt: task.parameters.prompt,
        systemPrompt: task.parameters.systemPrompt,
        model: route.primaryModel,
        temperature: task.parameters.temperature ?? route.config.temperature,
        maxTokens: task.parameters.maxTokens ?? route.config.maxTokens,
      });
      rawText = textResult.text;
    }
  } catch (primaryErr) {
    lastError = primaryErr as Error;
    console.warn(`[AIRouter] Primary provider (${route.config.defaultProvider}) failed for task ${task.taskId}: ${lastError.message}`);

    // 2. Attempt with Fallback Provider if allowed
    if (allowFallback && route.fallbackProvider) {
      try {
        usedProvider = route.config.fallbackProvider;
        usedModel = route.fallbackModel;
        isFallback = true;

        if (task.targetSchemaName) {
          outputData = await route.fallbackProvider.generateStructured<T>({
            prompt: task.parameters.prompt,
            systemPrompt: task.parameters.systemPrompt,
            model: route.fallbackModel,
            temperature: task.parameters.temperature ?? route.config.temperature,
            maxTokens: task.parameters.maxTokens ?? route.config.maxTokens,
          });
        } else {
          const textResult = await route.fallbackProvider.generateText({
            prompt: task.parameters.prompt,
            systemPrompt: task.parameters.systemPrompt,
            model: route.fallbackModel,
            temperature: task.parameters.temperature ?? route.config.temperature,
            maxTokens: task.parameters.maxTokens ?? route.config.maxTokens,
          });
          rawText = textResult.text;
        }
        lastError = null; // Cleared on fallback success
      } catch (fallbackErr) {
        lastError = fallbackErr as Error;
        console.error(`[AIRouter] Fallback provider (${usedProvider}) also failed for task ${task.taskId}: ${lastError.message}`);
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // 3. Schema validation check if structured schema was specified and we have data
  if (!lastError && task.targetSchemaName && outputData) {
    const validation = validateAgainstSchema(task.targetSchemaName, outputData);
    if (!validation.valid) {
      const errMsg = `[AIRouter] Structured output failed schema validation for '${task.targetSchemaName}': ${validation.errors.map((e) => `${e.path}: ${e.message}`).join(", ")}`;
      lastError = new Error(errMsg);
    }
  }

  const isSuccess = !lastError;
  const status = isSuccess ? (isFallback ? "FALLBACK_SUCCESS" : "SUCCESS") : "FAILED";

  // 4. Log AI usage
  try {
    await logAIUsage({
      projectId: task.projectId,
      taskType: task.taskType,
      provider: usedProvider,
      model: usedModel,
      inputTokens: 0,
      outputTokens: 0,
      status,
      errorCode: lastError ? lastError.name || "AI_ERROR" : undefined,
      durationMs,
      metadata: { taskId: task.taskId, targetSchemaName: task.targetSchemaName },
    });
  } catch (logErr) {
    console.warn(`[AIRouter] Failed to record usage log: ${(logErr as Error).message}`);
  }

  return {
    taskId: task.taskId,
    success: isSuccess,
    provider: usedProvider,
    model: usedModel,
    data: outputData,
    rawText,
    inputTokens: 0,
    outputTokens: 0,
    durationMs,
    error: lastError
      ? {
          code: lastError.name || "AI_EXECUTION_FAILED",
          message: lastError.message,
        }
      : undefined,
  };
}
