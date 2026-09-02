export interface SubscriptionRecord {
  id: string;
  userId: string;
  planCode: string; // 'FREE_TRIAL' | 'STANDARD' | 'PRO' | 'ENTERPRISE'
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  trialStartedAt: string; // ISO 8601
  trialExpiresAt: string; // ISO 8601
  startedAt: string;
  expiresAt: string | null;
  maxProjects: number;
}

export interface TrialStatusInfo {
  isTrial: boolean;
  isActive: boolean;
  isExpired: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  remainingMs: number;
  remainingDays: number;
  remainingHours: number;
  formattedRemaining: string;
}

export const TRIAL_DURATION_DAYS = 3;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Initializes a new 3-Day Trial subscription object anchored to the provided server time.
 */
export function initializeTrialSubscription(
  userId: string,
  serverTime: Date = new Date()
): SubscriptionRecord {
  const startedAt = serverTime.toISOString();
  const expiresAt = new Date(serverTime.getTime() + TRIAL_DURATION_MS).toISOString();

  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    planCode: "FREE_TRIAL",
    status: "ACTIVE",
    trialStartedAt: startedAt,
    trialExpiresAt: expiresAt,
    startedAt,
    expiresAt,
    maxProjects: 3,
  };
}

/**
 * Calculates trial status and validity using strictly the server-provided timestamp.
 * Any client device clock tampering has zero effect on trial validity.
 */
export function calculateTrialStatus(
  subscription: SubscriptionRecord | null,
  currentServerTime: Date = new Date()
): TrialStatusInfo {
  if (!subscription || subscription.planCode !== "FREE_TRIAL") {
    return {
      isTrial: false,
      isActive: false,
      isExpired: false,
      startedAt: null,
      expiresAt: null,
      remainingMs: 0,
      remainingDays: 0,
      remainingHours: 0,
      formattedRemaining: "Không có dùng thử",
    };
  }

  const expiresTime = new Date(subscription.trialExpiresAt).getTime();
  const currentTime = currentServerTime.getTime();
  const remainingMs = Math.max(0, expiresTime - currentTime);
  const isExpired = remainingMs <= 0 || subscription.status === "EXPIRED";
  const isActive = !isExpired && subscription.status === "ACTIVE";

  const totalRemainingSeconds = Math.floor(remainingMs / 1000);
  const remainingDays = Math.floor(totalRemainingSeconds / (24 * 3600));
  const remainingHours = Math.floor((totalRemainingSeconds % (24 * 3600)) / 3600);
  const remainingMinutes = Math.floor((totalRemainingSeconds % 3600) / 60);

  let formattedRemaining = "";
  if (isExpired) {
    formattedRemaining = "Hết hạn dùng thử";
  } else if (remainingDays > 0) {
    formattedRemaining = `${remainingDays} ngày ${remainingHours} giờ`;
  } else if (remainingHours > 0) {
    formattedRemaining = `${remainingHours} giờ ${remainingMinutes} phút`;
  } else {
    formattedRemaining = `${remainingMinutes} phút`;
  }

  return {
    isTrial: true,
    isActive,
    isExpired,
    startedAt: subscription.trialStartedAt,
    expiresAt: subscription.trialExpiresAt,
    remainingMs,
    remainingDays,
    remainingHours,
    formattedRemaining,
  };
}
