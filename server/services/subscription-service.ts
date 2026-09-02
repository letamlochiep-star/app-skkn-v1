import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  calculateTrialStatus,
  initializeTrialSubscription,
  type SubscriptionRecord,
} from "@/server/services/trial-service";
import type { PlanRecord, SubscriptionEntitlementRecord } from "@/types/entitlement";

// Static fallback plans for development and resilient operations
export const DEFAULT_PLANS: Record<string, PlanRecord> = {
  TRIAL: {
    id: "plan-trial-001",
    code: "TRIAL",
    name: "Gói Trải Nghiệm 3 Ngày",
    description: "Dùng thử miễn phí toàn bộ tính năng trợ lý SKKN trong 3 ngày.",
    status: "ACTIVE",
    durationDays: 3,
    maxProjects: 1,
    maxAiRequests: 30,
    maxAiTokens: 100000,
    maxStorageMb: 50,
    canExportDocx: false,
    canExportPdf: false,
    canExportPptx: false,
    canUseAiReview: true,
    canUseDefensePresentation: false,
  },
  PERSONAL_MONTHLY: {
    id: "plan-personal-m-001",
    code: "PERSONAL_MONTHLY",
    name: "Gói Giáo Viên 1 Tháng",
    description: "Dành cho giáo viên hoàn thiện SKKN trong tháng cao điểm.",
    status: "ACTIVE",
    durationDays: 30,
    maxProjects: 5,
    maxAiRequests: 300,
    maxAiTokens: 1000000,
    maxStorageMb: 500,
    canExportDocx: true,
    canExportPdf: true,
    canExportPptx: false,
    canUseAiReview: true,
    canUseDefensePresentation: true,
  },
  PERSONAL_YEARLY: {
    id: "plan-personal-y-001",
    code: "PERSONAL_YEARLY",
    name: "Gói Giáo Viên 1 Năm",
    description: "Giải pháp toàn diện cả năm học cho SKKN và Giải pháp hữu ích.",
    status: "ACTIVE",
    durationDays: 365,
    maxProjects: 30,
    maxAiRequests: 3000,
    maxAiTokens: 10000000,
    maxStorageMb: 5000,
    canExportDocx: true,
    canExportPdf: true,
    canExportPptx: true,
    canUseAiReview: true,
    canUseDefensePresentation: true,
  },
};

// In-memory subscriptions for test/offline resilience
const memorySubscriptions = new Map<string, SubscriptionRecord>();

export class SubscriptionService {
  /**
   * Sets an in-memory subscription record (useful for tests or mock users)
   */
  static setMemorySubscription(userId: string, record: SubscriptionRecord) {
    memorySubscriptions.set(userId, record);
  }

  /**
   * Clears in-memory subscriptions
   */
  static clearMemorySubscriptions() {
    memorySubscriptions.clear();
  }

  /**
   * Retrieves the current subscription record for a user
   */
  static async getCurrentSubscription(userId: string): Promise<SubscriptionRecord | null> {
    if (!userId) return null;

    if (memorySubscriptions.has(userId)) {
      return memorySubscriptions.get(userId)!;
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          planCode: data.plan_code,
          status: data.status,
          trialStartedAt: data.trial_started_at || data.created_at,
          trialExpiresAt: data.trial_expires_at || data.expires_at || new Date().toISOString(),
          startedAt: data.started_at,
          expiresAt: data.expires_at,
          maxProjects: data.max_projects || 1,
        };
      }
    } catch {
      // fallback
    }

    // Default baseline trial for registered users
    const defaultTrial = initializeTrialSubscription(userId);
    memorySubscriptions.set(userId, defaultTrial);
    return defaultTrial;
  }

  /**
   * Evaluates subscription status strictly based on server time
   */
  static async getSubscriptionStatus(userId: string, currentServerTime: Date = new Date()) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) {
      return {
        hasSubscription: false,
        isActive: false,
        isExpired: false,
        planCode: "NONE",
        trialStatus: calculateTrialStatus(null, currentServerTime),
      };
    }

    const trialStatus = calculateTrialStatus(sub, currentServerTime);
    const isActive = sub.planCode === "TRIAL" ? trialStatus.isActive : sub.status === "ACTIVE";

    return {
      hasSubscription: true,
      subscriptionId: sub.id,
      isActive,
      isExpired: sub.planCode === "TRIAL" ? trialStatus.isExpired : sub.status === "EXPIRED",
      planCode: sub.planCode,
      trialStatus,
    };
  }

  /**
   * Checks if the user's subscription is currently active
   */
  static async isSubscriptionActive(userId: string, currentServerTime: Date = new Date()): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId, currentServerTime);
    return status.isActive;
  }

  /**
   * Retrieves the plan configuration associated with the user
   */
  static async getCurrentPlan(userId: string): Promise<PlanRecord> {
    const sub = await this.getCurrentSubscription(userId);
    const planCode = sub?.planCode || "TRIAL";

    try {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("code", planCode)
        .single();

      if (data) {
        return {
          id: data.id,
          code: data.code,
          name: data.name,
          description: data.description,
          status: data.status,
          durationDays: data.duration_days,
          maxProjects: data.max_projects,
          maxAiRequests: data.max_ai_requests,
          maxAiTokens: Number(data.max_ai_tokens),
          maxStorageMb: data.max_storage_mb,
          canExportDocx: data.can_export_docx,
          canExportPdf: data.can_export_pdf,
          canExportPptx: data.can_export_pptx,
          canUseAiReview: data.can_use_ai_review,
          canUseDefensePresentation: data.can_use_defense_presentation,
        };
      }
    } catch {
      // fallback
    }

    return DEFAULT_PLANS[planCode] || DEFAULT_PLANS.TRIAL;
  }

  /**
   * Fetches the snapshot entitlements for a subscription
   */
  static async getSubscriptionEntitlements(
    subscriptionId: string
  ): Promise<SubscriptionEntitlementRecord[]> {
    if (!subscriptionId) return [];

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("subscription_entitlements")
        .select("*")
        .eq("subscription_id", subscriptionId);

      if (error || !data) return [];

      return data.map((d) => ({
        id: d.id,
        subscriptionId: d.subscription_id,
        featureCode: d.feature_code,
        allowed: d.allowed,
        limitValue: d.limit_value ? Number(d.limit_value) : null,
        createdAt: d.created_at,
      }));
    } catch {
      return [];
    }
  }
}
