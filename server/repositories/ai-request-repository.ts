import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { BaseRepository } from "./base-repository";

export interface AIRequestRecord {
  id: string;
  userId: string | null;
  projectId: string | null;
  provider: string;
  model: string;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  status: "SUCCESS" | "FAILED" | "FALLBACK_SUCCESS";
  errorCode: string | null;
  latencyMs: number | null;
  createdAt: string;
}

export class AIRequestRepository implements BaseRepository<AIRequestRecord> {
  async findById(id: string): Promise<AIRequestRecord | null> {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("ai_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      provider: data.provider,
      model: data.model,
      taskType: data.task_type,
      inputTokens: data.input_tokens || 0,
      outputTokens: data.output_tokens || 0,
      estimatedCost: Number(data.estimated_cost || 0),
      status: data.status,
      errorCode: data.error_code,
      latencyMs: data.latency_ms || data.duration_ms,
      createdAt: data.created_at,
    };
  }

  async findMany(filter?: Record<string, unknown>): Promise<AIRequestRecord[]> {
    const supabase = createAdminSupabaseClient();
    let query = supabase.from("ai_requests").select("*");

    if (filter?.projectId) {
      query = query.eq("project_id", filter.projectId);
    }
    if (filter?.userId) {
      query = query.eq("user_id", filter.userId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      projectId: item.project_id,
      provider: item.provider,
      model: item.model,
      taskType: item.task_type,
      inputTokens: item.input_tokens || 0,
      outputTokens: item.output_tokens || 0,
      estimatedCost: Number(item.estimated_cost || 0),
      status: item.status,
      errorCode: item.error_code,
      latencyMs: item.latency_ms || item.duration_ms,
      createdAt: item.created_at,
    }));
  }

  async create(data: Partial<AIRequestRecord>): Promise<AIRequestRecord> {
    const supabase = createAdminSupabaseClient();
    const { data: created, error } = await supabase
      .from("ai_requests")
      .insert({
        user_id: data.userId || null,
        project_id: data.projectId || null,
        provider: data.provider!,
        model: data.model!,
        task_type: data.taskType!,
        input_tokens: data.inputTokens || 0,
        output_tokens: data.outputTokens || 0,
        estimated_cost: data.estimatedCost || 0,
        status: data.status || "SUCCESS",
        error_code: data.errorCode || null,
        latency_ms: data.latencyMs || null,
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`[AIRequestRepository] Failed to insert AI request: ${error?.message}`);
    }

    return {
      id: created.id,
      userId: created.user_id,
      projectId: created.project_id,
      provider: created.provider,
      model: created.model,
      taskType: created.task_type,
      inputTokens: created.input_tokens || 0,
      outputTokens: created.output_tokens || 0,
      estimatedCost: Number(created.estimated_cost || 0),
      status: created.status,
      errorCode: created.error_code,
      latencyMs: created.latency_ms,
      createdAt: created.created_at,
    };
  }

  async update(): Promise<AIRequestRecord> {
    throw new Error("[AIRequestRepository] Updates not allowed on immutable audit records");
  }

  async delete(id: string): Promise<boolean> {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("ai_requests").delete().eq("id", id);
    return !error;
  }
}
