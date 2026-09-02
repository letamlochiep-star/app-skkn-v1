import type { AITaskType } from "@/lib/config/ai";

export type AIProviderName = "openai" | "gemini";

export type WorkflowStage =
  | "TOPIC"
  | "DATA"
  | "STRUCTURE"
  | "WRITE"
  | "REVIEW"
  | "FINALIZE";

export type WebappAction =
  | "analyze_topic"
  | "suggest_topics"
  | "lock_topic"
  | "next_questions"
  | "assess_data_completeness"
  | "propose_structure"
  | "lock_structure"
  | "draft_section"
  | "revise_section"
  | "review_full_document"
  | "final_consistency_check"
  // Defense & Solution Actions (Prepared for Phase 4/5)
  | "generate_defense_outline"
  | "generate_defense_script"
  | "generate_slide_content"
  | "generate_speaker_notes"
  | "generate_jury_questions"
  | "evaluate_defense_answer"
  | "optimize_presentation_timing"
  | "generate_one_page_summary";

export interface AIUsageRecordInput {
  userId?: string;
  projectId?: string;
  taskType: AITaskType | string;
  provider: AIProviderName | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost?: number;
  status: "SUCCESS" | "FAILED" | "FALLBACK_SUCCESS";
  errorCode?: string;
  latencyMs?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}
