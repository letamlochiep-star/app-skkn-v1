export type DefenseDuration = 5 | 7 | 10;

export type DefensePackageStatus = "DRAFT" | "GENERATING" | "READY" | "STALE" | "COMPLETED" | "FAILED";

export type DefenseComponentType =
  | "OUTLINE"
  | "SCRIPT"
  | "SLIDES"
  | "SPEAKER_NOTES"
  | "JURY_QUESTIONS"
  | "ANSWER_FRAMEWORKS"
  | "ONE_PAGE_SUMMARY";

export interface DefenseOutlineSegment {
  order: number;
  title: string;
  purpose: string;
  keyPoints: string[];
  durationSeconds: number;
  sourceSections?: string[];
}

export interface DefenseOutline {
  durationMinutes: DefenseDuration;
  segments: DefenseOutlineSegment[];
  totalDurationSeconds: number;
  warnings?: string[];
}

export interface DefenseScriptSection {
  segmentId?: string;
  spokenText: string;
  durationSeconds: number;
  keyFacts?: string[];
  evidenceKeys?: string[];
}

export interface DefenseScript {
  durationMinutes: DefenseDuration;
  sections: DefenseScriptSection[];
  closingStatement: string;
  warnings?: string[];
}

export interface DefenseSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  keyPoints: string[];
  keyMessage: string;
  visualSuggestion?: string;
  evidenceKeys?: string[];
  sourceSections?: string[];
  estimatedSeconds: number;
}

export interface DefenseSpeakerNote {
  slideNumber: number;
  talkingPoints: string[];
  emphasis: string[];
  transition: string;
  warning?: string;
  durationSeconds: number;
}

export interface JuryQuestionItem {
  id: string;
  category: string;
  difficulty: "BASIC" | "PROBING" | "CHALLENGING";
  question: string;
  whyAsked: string;
  sourceSections?: string[];
}

export interface AnswerFrameworkItem {
  questionId: string;
  directAnswer: string;
  evidenceKeys?: string[];
  supportingPoints: string[];
  limitations: string[];
  avoidClaims: string[];
  closingLine: string;
}

export interface OnePageSummary {
  title: string;
  problem: string;
  solution: string[];
  improvements: string[];
  evidence: string[];
  effectiveness: string[];
  applicability: string[];
  limitations: string[];
  closing: string;
}

export interface AnswerEvaluation {
  assessment: "STRONG" | "ADEQUATE" | "NEEDS_IMPROVEMENT" | "UNSUPPORTED";
  strengths: string[];
  issues: string[];
  unsupportedClaims: string[];
  missingEvidence: string[];
  improvedAnswerFramework: string[];
  followUpQuestion?: string;
}

export interface ProjectDefensePackageRecord {
  id: string;
  projectId: string;
  sourceDocumentId?: string | null;
  sourceDocumentVersion: number;
  sourceReviewId?: string | null;
  durationMinutes: DefenseDuration;
  version: number;
  status: DefensePackageStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface ProjectDefenseComponentRecord {
  id: string;
  defensePackageId: string;
  projectId: string;
  componentType: DefenseComponentType;
  version: number;
  contentJson: Record<string, unknown> | any[];
  status: string;
  aiRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDefensePracticeSessionRecord {
  id: string;
  projectId: string;
  defensePackageId?: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt?: string | null;
}

export interface ProjectDefensePracticeTurnRecord {
  id: string;
  sessionId: string;
  questionId: string;
  questionText: string;
  answerText: string;
  evaluationJson: AnswerEvaluation;
  createdAt: string;
}
