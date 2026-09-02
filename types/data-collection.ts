export type FactSourceType =
  | "USER_ENTERED"
  | "PROFILE"
  | "PROJECT_INITIAL"
  | "FILE_EXTRACTED"
  | "SYSTEM_CALCULATED"
  | "AI_SUGGESTED";

export type FactVerificationStatus =
  | "VERIFIED_BY_USER"
  | "UNVERIFIED"
  | "NEEDS_CONFIRMATION"
  | "NOT_APPLICABLE";

export type EvidenceStatus =
  | "AVAILABLE"
  | "COLLECTING"
  | "MISSING"
  | "NOT_APPLICABLE";

export type DataGroupKey =
  | "GENERAL"
  | "TARGET_GROUP"
  | "REALITY"
  | "CAUSES"
  | "GOALS"
  | "SOLUTIONS"
  | "EVIDENCE"
  | "LOCAL_RULES";

export type FactDataType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "PERCENTAGE"
  | "DATE"
  | "DATE_RANGE"
  | "SELECT"
  | "MULTI_SELECT"
  | "YES_NO"
  | "STATUS";

export type DataCompletenessStatus =
  | "INCOMPLETE"
  | "MINIMUM_READY"
  | "READY_FOR_STRUCTURE";

export interface ProjectFactItem {
  id: string;
  projectId: string;
  key: string;
  groupKey: DataGroupKey;
  value: unknown;
  sourceType: FactSourceType;
  verificationStatus: FactVerificationStatus;
  evidenceStatus?: EvidenceStatus | null;
  dataVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmartQuestion {
  id: string;
  fieldKey: string;
  group: DataGroupKey;
  question: string;
  helpText?: string;
  answerType: FactDataType;
  required: boolean;
  options?: string[];
}

export interface DataConflict {
  type: "COUNT_MISMATCH" | "DATE_MISMATCH" | "PERCENTAGE_MISMATCH" | "TEXT_CONTRADICTION";
  fieldKeys: string[];
  message: string;
  severity: "WARNING" | "BLOCKING";
}

export interface DataCompletenessSummary {
  status: DataCompletenessStatus;
  requiredTotal: number;
  requiredComplete: number;
  missingRequired: Array<{ key: string; label: string; group: DataGroupKey }>;
  warnings: string[];
  optionalSuggestions: string[];
}

export interface DataGroupMeta {
  key: DataGroupKey;
  title: string;
  description: string;
  icon: string;
  isBlocking: boolean;
}
