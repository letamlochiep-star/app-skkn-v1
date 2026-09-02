import { SubscriptionService } from "@/server/services/subscription-service";
import { UsageService } from "@/server/services/usage-service";
import type {
  FeatureCode,
  EntitlementCheckResult,
} from "@/types/entitlement";

export interface CheckEntitlementInput {
  userId: string;
  feature: FeatureCode;
  requestedAmount?: number;
  serverTime?: Date;
}

export class EntitlementService {
  /**
   * Evaluates if a user is entitled to perform a feature action.
   * Resolves plan, trial expiration, snapshot permissions, and remaining quota.
   */
  static async checkEntitlement(input: CheckEntitlementInput): Promise<EntitlementCheckResult> {
    const { userId, feature, requestedAmount = 1, serverTime = new Date() } = input;

    if (!userId) {
      return {
        allowed: false,
        errorCode: "SUBSCRIPTION_INACTIVE",
        reason: "Yêu cầu đăng nhập để kiểm tra quyền sử dụng.",
        planCode: "NONE",
      };
    }

    // 1. Check Subscription Status
    const subStatus = await SubscriptionService.getSubscriptionStatus(userId, serverTime);
    if (!subStatus.hasSubscription || !subStatus.isActive) {
      if (subStatus.isExpired && subStatus.planCode === "TRIAL") {
        return {
          allowed: false,
          errorCode: "TRIAL_EXPIRED",
          reason: "Thời gian trải nghiệm 3 ngày đã kết thúc. Vui lòng nâng cấp gói để tiếp tục.",
          planCode: subStatus.planCode,
        };
      }

      return {
        allowed: false,
        errorCode: "SUBSCRIPTION_INACTIVE",
        reason: "Gói dịch vụ của bạn hiện không hoạt động hoặc đã hết hạn.",
        planCode: subStatus.planCode,
      };
    }

    // 2. Fetch Plan & Snapshot Entitlements
    const plan = await SubscriptionService.getCurrentPlan(userId);
    const planCode = plan.code;

    // Check boolean feature access
    if (feature === "EXPORT_DOCX" && !plan.canExportDocx) {
      return {
        allowed: false,
        errorCode: "FEATURE_NOT_INCLUDED",
        reason: "Tính năng xuất file Word (.docx) chỉ có trong gói trả phí.",
        planCode,
      };
    }

    if (feature === "EXPORT_PDF" && !plan.canExportPdf) {
      return {
        allowed: false,
        errorCode: "FEATURE_NOT_INCLUDED",
        reason: "Tính năng xuất file PDF chỉ có trong gói trả phí.",
        planCode,
      };
    }

    if (feature === "EXPORT_PPTX" && !plan.canExportPptx) {
      return {
        allowed: false,
        errorCode: "FEATURE_NOT_INCLUDED",
        reason: "Tính năng xuất Slide PowerPoint chỉ có trong gói trả phí nâng cao.",
        planCode,
      };
    }

    if (feature === "DEFENSE_PRESENTATION" && !plan.canUseDefensePresentation) {
      return {
        allowed: false,
        errorCode: "FEATURE_NOT_INCLUDED",
        reason: "Tính năng hỗ trợ thuyết trình trước Ban giám khảo chỉ có trong gói trả phí.",
        planCode,
      };
    }

    if (feature === "AI_REVIEW" && !plan.canUseAiReview) {
      return {
        allowed: false,
        errorCode: "FEATURE_NOT_INCLUDED",
        reason: "Tính năng chấm phản biện SKKN không có trong gói của bạn.",
        planCode,
      };
    }

    // 3. Check Numerical Quotas
    const summary = await UsageService.getUsageSummary(userId);

    if (feature === "CREATE_PROJECT") {
      const { used, limit, remaining } = summary.projects;
      if (used + requestedAmount > limit) {
        return {
          allowed: false,
          errorCode: "PROJECT_QUOTA_EXCEEDED",
          reason: `Bạn đã sử dụng hết số lượng đề tài (${used}/${limit}) của gói ${plan.name}.`,
          planCode,
          quota: { used, limit, remaining },
        };
      }
      return {
        allowed: true,
        planCode,
        quota: { used, limit, remaining },
      };
    }

    if (feature === "AI_GENERATE" || feature === "AI_REVIEW") {
      const { used, limit, remaining } = summary.aiRequests;
      if (used + requestedAmount > limit) {
        return {
          allowed: false,
          errorCode: "AI_REQUEST_QUOTA_EXCEEDED",
          reason: `Bạn đã sử dụng hết số lượt AI (${used}/${limit}) của gói ${plan.name}.`,
          planCode,
          quota: { used, limit, remaining },
        };
      }
      return {
        allowed: true,
        planCode,
        quota: { used, limit, remaining },
      };
    }

    if (feature === "UPLOAD_FILE") {
      const { used, limit, remaining } = summary.storageMb;
      if (used + requestedAmount > limit) {
        return {
          allowed: false,
          errorCode: "STORAGE_QUOTA_EXCEEDED",
          reason: `Dung lượng tải lên (${used + requestedAmount}MB/${limit}MB) đã vượt quá hạn mức cho phép.`,
          planCode,
          quota: { used, limit, remaining },
        };
      }
      return {
        allowed: true,
        planCode,
        quota: { used, limit, remaining },
      };
    }

    // Baseline allowed for basic dashboard & profile features
    return {
      allowed: true,
      planCode,
    };
  }
}
