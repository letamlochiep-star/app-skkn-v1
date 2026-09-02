import type { SubjectGroup, EducationLevel } from "./skkn-session";
import type { AITaskType } from "@/lib/config/ai";

export type WorkflowStage =
  | "TOPIC"
  | "DATA"
  | "STRUCTURE"
  | "WRITE"
  | "REVIEW"
  | "FINALIZE";

export type DocumentType = "SKKN" | "SOLUTION";

export interface KnowledgeModuleSelectionInput {
  subjectGroup: SubjectGroup;
  educationLevel: EducationLevel;
  taskType: AITaskType;
  workflowStage?: WorkflowStage;
  documentType?: DocumentType;
}

export interface SelectedKnowledgeModule {
  id: string;
  fileName: string;
  relativePath: string;
  category: "CORE" | "SUBJECT" | "PEDAGOGY" | "POLICY" | "EVIDENCE" | "INNOVATION";
  priority: number;
}

export interface PolicyMetadata {
  policySnapshotDate: string; // e.g. "2026-09-02"
  effectiveSchoolYear: string; // e.g. "2026-2027"
  framework: string; // e.g. "GDPT 2018"
}
