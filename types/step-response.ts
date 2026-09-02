import type { ValidationError } from "@/lib/validation/json-schema-validator";

export type StepStatus = "SUCCESS" | "VALIDATION_ERROR" | "PROCESSING_ERROR";

export interface StepResponse<T = Record<string, unknown>> {
  stepId: number;
  status: StepStatus;
  result: T;
  validationErrors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  suggestions?: string[];
  timestamp: string; // ISO 8601
}
