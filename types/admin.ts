export type UserRole = "TEACHER" | "ADMIN" | "SUPPORT";

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeTrials: number;
  activeSubscriptions: number;
  activeLicenses: number;
  activeDevices: number;
  totalProjects: number;
  totalExports: number;
  totalAICostUsd: number;
  totalAITokens: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  schoolName?: string;
  planCode: string;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  projectCount: number;
  createdAt: string;
}

export interface AdminLicenseSummary {
  id: string;
  licenseKey: string;
  planCode: string;
  maxDevices: number;
  activeDevices: number;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  assignedUserId?: string | null;
  assignedUserEmail?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface AdminDeviceSummary {
  id: string;
  licenseKey: string;
  userId: string;
  userEmail?: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  status: "ACTIVE" | "DEACTIVATED";
  activatedAt: string;
  lastActiveAt?: string;
}

export interface AICostBreakdown {
  provider: string;
  model: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
}

export interface AdminAuditLogRecord {
  id: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  detailsJson: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt: string;
}
