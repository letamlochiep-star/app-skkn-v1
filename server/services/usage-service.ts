import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/server/services/subscription-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import type {
  FeatureCode,
  UsageType,
  UsageLedgerRecord,
  UsageSummary,
} from "@/types/entitlement";

export interface RecordUsageInput {
  userId: string;
  subscriptionId?: string;
  projectId?: string;
  feature: FeatureCode;
  usageType: UsageType;
  quantity?: number;
  idempotencyKey?: string;
  metadataJson?: Record<string, unknown>;
}

// In-memory ledger storage for test runtime and fast local aggregation
const memoryLedger: UsageLedgerRecord[] = [];
const processedIdempotencyKeys = new Set<string>();

export class UsageService {
  private static projectRepo = new ProjectRepository();

  /**
   * Records a usage event into the ledger with idempotency support
   */
  static async recordUsage(input: RecordUsageInput): Promise<UsageLedgerRecord> {
    const quantity = input.quantity ?? 1;

    // 1. Check idempotency key to prevent double charging on retry
    if (input.idempotencyKey) {
      if (processedIdempotencyKeys.has(input.idempotencyKey)) {
        const existing = memoryLedger.find((l) => l.idempotencyKey === input.idempotencyKey);
        if (existing) return existing;
      }
      processedIdempotencyKeys.add(input.idempotencyKey);
    }

    const record: UsageLedgerRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: input.userId,
      subscriptionId: input.subscriptionId || null,
      projectId: input.projectId || null,
      feature: input.feature,
      usageType: input.usageType,
      quantity,
      idempotencyKey: input.idempotencyKey || null,
      metadataJson: input.metadataJson || {},
      createdAt: new Date().toISOString(),
    };

    memoryLedger.push(record);

    // 2. Persist to Supabase if connected
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("usage_ledger").insert({
        id: record.id,
        user_id: record.userId,
        subscription_id: record.subscriptionId,
        project_id: record.projectId,
        feature: record.feature,
        usage_type: record.usageType,
        quantity: record.quantity,
        idempotency_key: record.idempotencyKey,
        metadata_json: record.metadataJson,
      });
    } catch {
      // Memory ledger keeps functioning in test/offline environment
    }

    return record;
  }

  /**
   * Returns total active projects for a user (deleted_at IS NULL AND status != 'ARCHIVED')
   */
  static async getActiveProjectCount(userId: string): Promise<number> {
    const activeFromRepo = await this.projectRepo.countActiveByUser(userId);
    return activeFromRepo;
  }

  /**
   * Returns total cumulative usage for a specific feature by a user
   */
  static async getFeatureUsage(userId: string, feature: FeatureCode): Promise<number> {
    if (!userId) return 0;

    let ledgerCount = 0;
    for (const item of memoryLedger) {
      if (item.userId === userId && item.feature === feature) {
        ledgerCount += item.quantity;
      }
    }

    if (feature === "CREATE_PROJECT") {
      const activeFromRepo = await this.getActiveProjectCount(userId);
      const userProjects = await this.projectRepo.listByUser(userId, { limit: 100 });
      if (userProjects.total > 0) {
        return activeFromRepo;
      }
      return ledgerCount;
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("usage_ledger")
        .select("quantity")
        .eq("user_id", userId)
        .eq("feature", feature);

      if (data && data.length > 0) {
        ledgerCount = data.reduce((acc, row) => acc + Number(row.quantity), 0);
      }
    } catch {
      // Use local aggregation
    }

    return ledgerCount;
  }

  /**
   * Returns total token usage for a user
   */
  static async getTokenUsage(userId: string): Promise<number> {
    if (!userId) return 0;

    let total = 0;
    for (const item of memoryLedger) {
      if (
        item.userId === userId &&
        (item.usageType === "AI_INPUT_TOKENS" || item.usageType === "AI_OUTPUT_TOKENS")
      ) {
        total += item.quantity;
      }
    }
    return total;
  }

  /**
   * Calculates full usage summary vs plan limits
   */
  static async getUsageSummary(userId: string): Promise<UsageSummary> {
    const plan = await SubscriptionService.getCurrentPlan(userId);

    const projectUsed = await this.getFeatureUsage(userId, "CREATE_PROJECT");
    const aiRequestUsed = await this.getFeatureUsage(userId, "AI_GENERATE");
    const aiTokenUsed = await this.getTokenUsage(userId);
    const storageUsed = await this.getFeatureUsage(userId, "UPLOAD_FILE");

    return {
      planCode: plan.code,
      projects: {
        used: projectUsed,
        limit: plan.maxProjects,
        remaining: Math.max(0, plan.maxProjects - projectUsed),
      },
      aiRequests: {
        used: aiRequestUsed,
        limit: plan.maxAiRequests,
        remaining: Math.max(0, plan.maxAiRequests - aiRequestUsed),
      },
      aiTokens: {
        used: aiTokenUsed,
        limit: plan.maxAiTokens,
        remaining: Math.max(0, plan.maxAiTokens - aiTokenUsed),
      },
      storageMb: {
        used: storageUsed,
        limit: plan.maxStorageMb,
        remaining: Math.max(0, plan.maxStorageMb - storageUsed),
      },
    };
  }

  /**
   * Returns remaining quota for a feature
   */
  static async getRemainingQuota(userId: string, feature: FeatureCode): Promise<number> {
    const summary = await this.getUsageSummary(userId);
    switch (feature) {
      case "CREATE_PROJECT":
        return summary.projects.remaining;
      case "AI_GENERATE":
      case "AI_REVIEW":
        return summary.aiRequests.remaining;
      case "UPLOAD_FILE":
        return summary.storageMb.remaining;
      default:
        return 999999;
    }
  }

  /**
   * Resets in-memory ledger (used in tests)
   */
  static clearMemoryLedger() {
    memoryLedger.length = 0;
    processedIdempotencyKeys.clear();
  }
}
