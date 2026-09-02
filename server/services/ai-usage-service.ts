import { estimateTokenCost } from "@/lib/config/ai";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AIUsageRecordInput } from "@/types/ai";

export interface AIUsageRecord extends AIUsageRecordInput {
  id: string;
  estimatedCost: number;
  createdAt: string;
}

// In-memory fallback log store for test and development without active DB
const memoryUsageLogs: AIUsageRecord[] = [];

/**
 * Records AI request usage, latency, tokens, and estimated costs.
 */
export async function recordAIRequest(input: AIUsageRecordInput): Promise<AIUsageRecord> {
  const estimatedCost = input.estimatedCost ?? estimateTokenCost(input.model, input.inputTokens, input.outputTokens);
  const now = new Date().toISOString();

  const record: AIUsageRecord = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...input,
    estimatedCost,
    createdAt: now,
  };

  memoryUsageLogs.push(record);

  // If Supabase service role key is configured, persist to database
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createAdminSupabaseClient();
      await supabase.from("ai_requests").insert({
        user_id: input.userId || null,
        project_id: input.projectId || null,
        task_type: input.taskType,
        provider: input.provider,
        model: input.model,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        estimated_cost: estimatedCost,
        status: input.status,
        error_code: input.errorCode || null,
        latency_ms: input.latencyMs || null,
      });
    } catch (dbErr) {
      console.warn(`[AIUsageService] DB insert skipped: ${(dbErr as Error).message}`);
    }
  }

  return record;
}

/**
 * Backward-compatible alias for logAIUsage
 */
export const logAIUsage = recordAIRequest;

/**
 * Retrieves in-memory logged records (for testing/inspection)
 */
export function getMemoryUsageLogs(): AIUsageRecord[] {
  return [...memoryUsageLogs];
}

/**
 * Clears in-memory log store
 */
export function clearMemoryUsageLogs(): void {
  memoryUsageLogs.length = 0;
}
