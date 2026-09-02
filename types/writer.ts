export type SectionStatus = "DRAFT" | "USER_EDITED" | "APPROVED" | "BLOCKED" | "STALE";

export type SectionSource = "AI_GENERATED" | "USER_EDITED" | "USER_CREATED" | "ASSEMBLED";

export type WritingRunStatus = "PENDING" | "GENERATING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "STALE";

export type DocumentDraftStatus = "ASSEMBLING" | "DRAFT" | "READY_FOR_REVIEW" | "STALE";

export interface ProjectSectionRecord {
  id: string;
  projectId: string;
  structureSectionId?: string | null;
  promptNumber: number; // 1 to 18
  title: string;
  content: string;
  status: SectionStatus;
  source: SectionSource;
  version: number;
  dataVersion: number;
  structureVersion: number;
  promptSetVersion: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface ProjectSectionVersionRecord {
  id: string;
  sectionId: string;
  projectId: string;
  promptNumber: number;
  version: number;
  content: string;
  source: SectionSource;
  createdBy?: string | null;
  aiRequestId?: string | null;
  createdAt: string;
}

export interface ProjectWritingRunRecord {
  id: string;
  projectId: string;
  promptSetId?: string | null;
  promptId?: string | null;
  promptNumber: number;
  logicalRequestId?: string | null;
  status: WritingRunStatus;
  dataVersion: number;
  structureVersion: number;
  promptSetVersion: number;
  aiRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface ProjectDocumentDraftRecord {
  id: string;
  projectId: string;
  version: number;
  contentJson: any[];
  plainText: string;
  status: DocumentDraftStatus;
  placeholderSummary: {
    realDataPlaceholders: number;
    evidencePlaceholders: number;
    referencePlaceholders: number;
  };
  dataVersion: number;
  structureVersion: number;
  promptSetVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsistencyConflict {
  type: string;
  message: string;
  severity: "WARNING" | "BLOCKING";
}

export interface ConsistencyCheckResult {
  valid: boolean;
  conflicts: ConsistencyConflict[];
  placeholderSummary: {
    realDataPlaceholders: number;
    evidencePlaceholders: number;
    referencePlaceholders: number;
  };
}
