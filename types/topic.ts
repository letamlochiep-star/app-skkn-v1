export type CandidateSource = "USER_INPUT" | "AI_SUGGESTED" | "USER_EDITED";

export type CandidateStatus = "PROPOSED" | "SELECTED" | "REJECTED" | "LOCKED";

export interface TopicCandidate {
  id: string;
  projectId: string;
  source: CandidateSource;
  title: string;
  rationale?: string;
  strengths: string[];
  evidenceFeasibility?: string;
  notes?: string;
  rank: number;
  status: CandidateStatus;
  aiRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicHistoryRecord {
  id: string;
  projectId: string;
  action: "LOCKED" | "UNLOCKED" | "CHANGED";
  previousTitle?: string | null;
  newTitle: string;
  userId: string;
  createdAt: string;
}

export interface CriterionAnalysis {
  status: "GOOD" | "NEEDS_CLARIFICATION" | "NEEDS_REVISION";
  comment: string;
}

export interface TopicAnalysisResult {
  action: "analyze_topic";
  analysis: {
    object: CriterionAnalysis;
    problem: CriterionAnalysis;
    intervention: CriterionAnalysis;
    scope: CriterionAnalysis;
    clarity: CriterionAnalysis;
    novelty: CriterionAnalysis;
    measurability: CriterionAnalysis;
    evidenceFeasibility: CriterionAnalysis;
  };
  strengths: string[];
  needsRevision: string[];
  suggestions: Array<{
    title: string;
    direction: "SAFE" | "INTERVENTION_FOCUS" | "NOVELTY_OR_SCOPE_FOCUS";
    rationale: string;
    evidenceFeasibility: string;
  }>;
}

export interface TopicSuggestionsResult {
  action: "suggest_topics";
  topics: Array<{
    title: string;
    rationale: string;
    strengths: string[];
    evidenceFeasibility: string;
    notes: string;
  }>;
  recommendedIndex: number;
  recommendationReason: string;
}

export interface TopicInputStatus {
  known: {
    documentType: string;
    educationLevel: string;
    subjectGroup: string;
    gradeLevel?: string | null;
    schoolYear: string;
    problemStatement?: string;
    targetGroup?: string;
    initialGoal?: string;
    teacherNotes?: string;
  };
  missing: Array<{
    key: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  readyForSuggestion: boolean;
}
