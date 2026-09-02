import { EntitlementService } from "@/server/services/entitlement-service";
import type { FeatureCode, EntitlementCheckResult } from "@/types/entitlement";

export interface RequireQuotaInput {
  userId: string;
  feature: FeatureCode;
  requestedAmount?: number;
  requestId?: string;
}

export class QuotaExceededError extends Error {
  errorCode: string;
  planCode: string;
  quota?: { used: number; limit: number; remaining: number };

  constructor(result: EntitlementCheckResult) {
    super(result.reason || "Bạn đã vượt quá hạn mức sử dụng cho phép.");
    this.name = "QuotaExceededError";
    this.errorCode = result.errorCode || "QUOTA_EXCEEDED";
    this.planCode = result.planCode;
    this.quota = result.quota;
  }
}

/**
 * Server Guard: Checks whether user has sufficient quota for an action.
 * Throws QuotaExceededError if quota is exceeded or trial is expired.
 */
export async function requireQuota(input: RequireQuotaInput): Promise<EntitlementCheckResult> {
  const result = await EntitlementService.checkEntitlement({
    userId: input.userId,
    feature: input.feature,
    requestedAmount: input.requestedAmount ?? 1,
  });

  if (!result.allowed) {
    throw new QuotaExceededError(result);
  }

  return result;
}
