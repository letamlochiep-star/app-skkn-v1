export type SubjectGroup =
  | "MATH"
  | "LITERATURE"
  | "NATURAL_SCIENCES"
  | "SOCIAL_SCIENCES"
  | "FOREIGN_LANGUAGES"
  | "PRIMARY_GENERAL"
  | "PRE_SCHOOL"
  | "OTHER";

export type EducationLevel =
  | "PRE_SCHOOL"
  | "PRIMARY"
  | "SECONDARY"
  | "HIGH_SCHOOL"
  | "VOCATIONAL"
  | "HIGHER_EDUCATION";

export type SessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "FAILED";

export interface SKKNContextData {
  subjectGroup: SubjectGroup;
  educationLevel: EducationLevel;
  targetGrade?: string;
  topicTitle?: string;
  collectedFacts?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SKKNSession {
  sessionId: string; // UUID
  projectId: string; // UUID
  userId: string;    // UUID
  currentStep: number; // 1 to 5
  status: SessionStatus;
  contextData: SKKNContextData;
  updatedAt: string; // ISO 8601
}
