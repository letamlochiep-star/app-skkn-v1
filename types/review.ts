export type FindingSeverity = "BLOCKING" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type FindingCategory =
  | "STRUCTURE"
  | "PROBLEM_DEFINITION"
  | "THEORY"
  | "CURRENT_STATE"
  | "CAUSE"
  | "SOLUTION"
  | "NOVELTY"
  | "DATA"
  | "EVIDENCE"
  | "EFFECTIVENESS"
  | "FEASIBILITY"
  | "SCALABILITY"
  | "REFERENCE"
  | "STYLE"
  | "CONSISTENCY"
  | "FORMATTING";

export type FindingType = "MANDATORY_FIX" | "QUALITY_IMPROVEMENT" | "KEEP_AS_IS" | "PRIORITY_REVISION";

export type FindingStatus = "OPEN" | "ACCEPTED" | "DISMISSED" | "RESOLVED" | "SUPERSEDED";

export type ReviewRunStatus = "PENDING" | "AUDITING" | "AI_REVIEWING" | "VALIDATING" | "READY" | "FAILED" | "SUPERSEDED";

export type RubricAssessmentStatus = "STRONG" | "ADEQUATE" | "NEEDS_IMPROVEMENT" | "INSUFFICIENT_EVIDENCE" | "NOT_APPLICABLE";

export interface RubricCriterion {
  criterion: string;
  assessment: RubricAssessmentStatus;
  strengths: string;
  issues: string;
  evidence: string;
  recommendation: string;
}

export interface PriorityRevision {
  priorityNumber: number; // 1, 2, 3
  problem: string;
  whyItMatters: string;
  recommendedChange: string;
  documentLocation: string;
  requiredEvidenceOrData: string[];
}

export interface ReviewFindingItem {
  id?: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  whyItMatters?: string;
  suggestedFix?: string;
  documentLocation?: string;
  requiredDataKeys?: string[];
  status?: FindingStatus;
}

export interface ReviewSummary {
  overallAssessment: string;
  strengths: string[];
  mainRisks: string[];
}

export interface ProjectReviewFindingRecord {
  id: string;
  reviewRunId: string;
  projectId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  findingType: FindingType;
  sectionId?: string | null;
  locationJson?: Record<string, unknown>;
  title: string;
  description: string;
  whyItMatters?: string | null;
  suggestedFix?: string | null;
  requiredDataKeys?: string[];
  priorityNumber?: number | null;
  status: FindingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectReviewRunRecord {
  id: string;
  projectId: string;
  documentDraftId?: string | null;
  documentVersion: number;
  reviewVersion: number;
  status: ReviewRunStatus;
  rubricSource: string;
  summaryJson?: {
    overallAssessment?: string;
    strengths?: string[];
    mainRisks?: string[];
    rubric?: RubricCriterion[];
    priorityRevisions?: PriorityRevision[];
  };
  aiRequestId?: string | null;
  dataVersion: number;
  structureVersion: number;
  createdAt: string;
  completedAt?: string | null;
}

export interface FullReviewPayload {
  action: "review_full_document";
  summary: ReviewSummary;
  rubric: RubricCriterion[];
  mandatoryFixes: ReviewFindingItem[];
  qualityImprovements: ReviewFindingItem[];
  keepAsIs: ReviewFindingItem[];
  priorityRevisions: PriorityRevision[]; // exactly 3
  warnings: string[];
}
