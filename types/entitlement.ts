export type PlanCode =
  | "TRIAL"
  | "PERSONAL_MONTHLY"
  | "PERSONAL_6_MONTHS"
  | "PERSONAL_YEARLY"
  | "PRO"
  | "SCHOOL";

export type FeatureCode =
  | "DASHBOARD_ACCESS"
  | "PROFILE_ACCESS"
  | "CREATE_PROJECT"
  | "AI_GENERATE"
  | "AI_REVIEW"
  | "UPLOAD_FILE"
  | "EXPORT_DOCX"
  | "EXPORT_PDF"
  | "EXPORT_PPTX"
  | "DEFENSE_PRESENTATION";

export type UsageType =
  | "PROJECT_CREATED"
  | "AI_REQUEST"
  | "AI_INPUT_TOKENS"
  | "AI_OUTPUT_TOKENS"
  | "FILE_UPLOAD_MB"
  | "EXPORT_DOCX"
  | "EXPORT_PDF"
  | "EXPORT_PPTX"
  | "AI_REVIEW"
  | "DEFENSE_PRESENTATION";

export type QuotaErrorCode =
  | "TRIAL_EXPIRED"
  | "PROJECT_QUOTA_EXCEEDED"
  | "AI_REQUEST_QUOTA_EXCEEDED"
  | "AI_TOKEN_QUOTA_EXCEEDED"
  | "STORAGE_QUOTA_EXCEEDED"
  | "FEATURE_NOT_INCLUDED"
  | "SUBSCRIPTION_INACTIVE";

export interface PlanRecord {
  id: string;
  code: PlanCode | string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ARCHIVED";
  durationDays: number;
  maxProjects: number;
  maxAiRequests: number;
  maxAiTokens: number;
  maxStorageMb: number;
  canExportDocx: boolean;
  canExportPdf: boolean;
  canExportPptx: boolean;
  canUseAiReview: boolean;
  canUseDefensePresentation: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionEntitlementRecord {
  id: string;
  subscriptionId: string;
  featureCode: FeatureCode | string;
  allowed: boolean;
  limitValue: number | null;
  createdAt?: string;
}

export interface UsageLedgerRecord {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  projectId?: string | null;
  feature: FeatureCode | string;
  usageType: UsageType | string;
  quantity: number;
  idempotencyKey?: string | null;
  metadataJson?: Record<string, unknown>;
  createdAt?: string;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  errorCode?: QuotaErrorCode;
  planCode: string;
  quota?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface UsageSummary {
  planCode: string;
  projects: { used: number; limit: number; remaining: number };
  aiRequests: { used: number; limit: number; remaining: number };
  aiTokens: { used: number; limit: number; remaining: number };
  storageMb: { used: number; limit: number; remaining: number };
}
