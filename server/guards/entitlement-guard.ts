export interface EntitlementCheckResult {
  allowed: boolean;
  featureKey: string;
  reason?: string;
  remainingQuota?: number;
}

/**
 * Guard: Checks user entitlement/subscription for a given feature.
 * Phase 0 implementation provides the interface and base validation placeholder.
 */
export async function requireEntitlement(
  userId: string,
  featureKey: string
): Promise<EntitlementCheckResult> {
  if (!userId) {
    throw new Error("UNAUTHORIZED: User ID required for entitlement check");
  }

  // Phase 0 default behavior: allow development foundation operations
  return {
    allowed: true,
    featureKey,
    remainingQuota: 999,
  };
}
