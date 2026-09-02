export type PromptStatus = "READY" | "READY_WITH_PLACEHOLDERS" | "BLOCKED";

export type PromptSetStatus = "GENERATING" | "VALIDATING" | "READY" | "FAILED" | "SUPERSEDED";

export interface ProjectPrompt {
  id: string;
  promptSetId: string;
  projectId: string;
  promptNumber: number; // 1 to 18
  title: string;
  purpose: string;
  promptText: string;
  requiredDataKeys: string[];
  missingDataKeys: string[];
  status: PromptStatus;
  immutable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPromptSet {
  id: string;
  projectId: string;
  structureId?: string | null;
  version: number;
  status: PromptSetStatus;
  promptCount: number; // exactly 18
  dataVersion: number;
  promptFrameworkVersion: string;
  aiRequestId?: string | null;
  prompts?: ProjectPrompt[];
  createdAt: string;
  updatedAt: string;
  lockedAt?: string | null;
}

export interface PromptSetValidationResult {
  valid: boolean;
  count: number;
  errors: string[];
  warnings: string[];
  structureCoverage: Record<string, number[]>; // sectionId -> promptNumbers
}
