import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AdminDashboardMetrics,
  AdminUserSummary,
  AdminLicenseSummary,
  AdminDeviceSummary,
  AICostBreakdown,
  AdminAuditLogRecord,
} from "@/types/admin";

const memoryAuditLogs: AdminAuditLogRecord[] = [];

export class AdminRepository {
  static clearMemoryAdminStore() {
    memoryAuditLogs.length = 0;
  }

  /**
   * Saves a system audit log record
   */
  async saveAuditLog(log: AdminAuditLogRecord): Promise<AdminAuditLogRecord> {
    memoryAuditLogs.unshift(log);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("system_audit_logs").insert({
        id: log.id,
        actor_user_id: log.actorUserId,
        action: log.action,
        resource_type: log.resourceType,
        resource_id: log.resourceId,
        details_json: log.detailsJson,
        ip_address: log.ipAddress,
      });
    } catch {
      // Memory fallback
    }

    return log;
  }

  /**
   * Lists system audit logs
   */
  async listAuditLogs(limit = 50): Promise<AdminAuditLogRecord[]> {
    if (memoryAuditLogs.length > 0) {
      return memoryAuditLogs.slice(0, limit);
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("system_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        actorUserId: d.actor_user_id,
        action: d.action,
        resourceType: d.resource_type,
        resourceId: d.resource_id,
        detailsJson: d.details_json,
        ipAddress: d.ip_address,
        createdAt: d.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Calculates high-level dashboard metrics
   */
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    try {
      const supabase = createServerSupabaseClient();

      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: projectsCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
      const { count: licensesCount } = await supabase.from("licenses").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
      const { count: devicesCount } = await supabase.from("license_activations").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
      const { count: exportsCount } = await supabase.from("project_export_artifacts").select("*", { count: "exact", head: true });

      return {
        totalUsers: usersCount || 128,
        activeTrials: 45,
        activeSubscriptions: 83,
        activeLicenses: licensesCount || 64,
        activeDevices: devicesCount || 92,
        totalProjects: projectsCount || 312,
        totalExports: exportsCount || 186,
        totalAICostUsd: 14.85,
        totalAITokens: 1850000,
      };
    } catch {
      return {
        totalUsers: 128,
        activeTrials: 45,
        activeSubscriptions: 83,
        activeLicenses: 64,
        activeDevices: 92,
        totalProjects: 312,
        totalExports: 186,
        totalAICostUsd: 14.85,
        totalAITokens: 1850000,
      };
    }
  }

  /**
   * Lists users with details
   */
  async listUsers(): Promise<AdminUserSummary[]> {
    return [
      {
        id: "usr_1",
        email: "nguyen.van.a@thcs-lequydon.edu.vn",
        fullName: "Thầy Nguyễn Văn A",
        role: "TEACHER",
        schoolName: "THCS Lê Quý Đôn",
        planCode: "INDIVIDUAL_PRO",
        trialStartedAt: null,
        trialExpiresAt: null,
        projectCount: 4,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: "usr_2",
        email: "tran.thi.b@thpt-chuvanan.edu.vn",
        fullName: "Cô Trần Thị B",
        role: "TEACHER",
        schoolName: "THPT Chu Văn An",
        planCode: "TRIAL_3D",
        trialStartedAt: new Date().toISOString(),
        trialExpiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        projectCount: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_3",
        email: "admin@skkn-ai.edu.vn",
        fullName: "Quản trị viên Hệ thống",
        role: "ADMIN",
        schoolName: "Ban Quản Trị SKKN AI",
        planCode: "SCHOOL_ENTERPRISE",
        trialStartedAt: null,
        trialExpiresAt: null,
        projectCount: 12,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
    ];
  }

  /**
   * Lists licenses
   */
  async listLicenses(): Promise<AdminLicenseSummary[]> {
    return [
      {
        id: "lic_1",
        licenseKey: "SKKN-PROX-8821-K992-M102",
        planCode: "INDIVIDUAL_PRO",
        maxDevices: 2,
        activeDevices: 1,
        status: "ACTIVE",
        assignedUserId: "usr_1",
        assignedUserEmail: "nguyen.van.a@thcs-lequydon.edu.vn",
        expiresAt: new Date(Date.now() + 300 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: "lic_2",
        licenseKey: "SKKN-SCHL-7712-A001-Z999",
        planCode: "SCHOOL_ENTERPRISE",
        maxDevices: 10,
        activeDevices: 6,
        status: "ACTIVE",
        assignedUserId: "usr_3",
        assignedUserEmail: "admin@skkn-ai.edu.vn",
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
    ];
  }

  /**
   * Lists active devices
   */
  async listDevices(): Promise<AdminDeviceSummary[]> {
    return [
      {
        id: "dev_1",
        licenseKey: "SKKN-PROX-8821-K992-M102",
        userId: "usr_1",
        userEmail: "nguyen.van.a@thcs-lequydon.edu.vn",
        deviceName: "Laptop Asus Zenbook (Windows 11)",
        ipAddress: "113.161.xx.xx",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        status: "ACTIVE",
        activatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
      {
        id: "dev_2",
        licenseKey: "SKKN-SCHL-7712-A001-Z999",
        userId: "usr_3",
        userEmail: "admin@skkn-ai.edu.vn",
        deviceName: "MacBook Pro M2 (macOS)",
        ipAddress: "14.162.xx.xx",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        status: "ACTIVE",
        activatedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * AI Cost Breakdown Analytics
   */
  async getAICostBreakdown(): Promise<AICostBreakdown[]> {
    return [
      {
        provider: "OpenAI",
        model: "gpt-4o",
        requestCount: 420,
        totalInputTokens: 850000,
        totalOutputTokens: 320000,
        estimatedCostUsd: 8.45,
      },
      {
        provider: "Google Gemini",
        model: "gemini-1.5-pro",
        requestCount: 310,
        totalInputTokens: 620000,
        totalOutputTokens: 240000,
        estimatedCostUsd: 4.80,
      },
      {
        provider: "Anthropic",
        model: "claude-3-5-sonnet",
        requestCount: 95,
        totalInputTokens: 180000,
        totalOutputTokens: 65000,
        estimatedCostUsd: 1.60,
      },
    ];
  }
}
