import { AdminRepository } from "@/server/repositories/admin-repository";
import { generateLicenseKey } from "@/server/services/license-generator";

export class AdminService {
  private static adminRepo = new AdminRepository();

  static async getDashboardOverview() {
    return await this.adminRepo.getDashboardMetrics();
  }

  static async listUsers() {
    return await this.adminRepo.listUsers();
  }

  static async updateUserPlan(params: {
    targetUserId: string;
    planCode: string;
    adminUserId: string;
  }) {
    const { targetUserId, planCode, adminUserId } = params;

    // Log action to audit
    await this.adminRepo.saveAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: adminUserId,
      action: "PLAN_UPGRADED",
      resourceType: "USER",
      resourceId: targetUserId,
      detailsJson: { planCode },
      createdAt: new Date().toISOString(),
    });

    return { status: "ok", message: `Đã cập nhật gói ${planCode} cho người dùng ${targetUserId}` };
  }

  static async extendUserTrial(params: {
    targetUserId: string;
    days: number;
    adminUserId: string;
  }) {
    const { targetUserId, days, adminUserId } = params;

    await this.adminRepo.saveAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: adminUserId,
      action: "TRIAL_EXTENDED",
      resourceType: "USER",
      resourceId: targetUserId,
      detailsJson: { extendedDays: days },
      createdAt: new Date().toISOString(),
    });

    return { status: "ok", message: `Đã gia hạn thêm ${days} ngày dùng thử cho người dùng ${targetUserId}` };
  }

  static async listLicenses() {
    return await this.adminRepo.listLicenses();
  }

  static async generateLicenses(params: {
    planCode: string;
    count: number;
    maxDevices: number;
    adminUserId: string;
  }) {
    const { planCode, count = 1, maxDevices = 2, adminUserId } = params;
    const generatedKeys: string[] = [];

    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey();
      generatedKeys.push(key);
    }

    await this.adminRepo.saveAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: adminUserId,
      action: "LICENSE_GENERATED",
      resourceType: "LICENSE",
      detailsJson: { planCode, count, maxDevices, keys: generatedKeys },
      createdAt: new Date().toISOString(),
    });

    return { status: "ok", count: generatedKeys.length, keys: generatedKeys };
  }

  static async revokeLicense(params: {
    licenseKey: string;
    adminUserId: string;
  }) {
    const { licenseKey, adminUserId } = params;

    await this.adminRepo.saveAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: adminUserId,
      action: "LICENSE_REVOKED",
      resourceType: "LICENSE",
      resourceId: licenseKey,
      detailsJson: { revokedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    });

    return { status: "ok", message: `Đã thu hồi giấy phép ${licenseKey}` };
  }

  static async listDevices() {
    return await this.adminRepo.listDevices();
  }

  static async deactivateDevice(params: {
    deviceId: string;
    adminUserId: string;
  }) {
    const { deviceId, adminUserId } = params;

    await this.adminRepo.saveAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: adminUserId,
      action: "DEVICE_DEACTIVATED",
      resourceType: "DEVICE",
      resourceId: deviceId,
      detailsJson: { deactivatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    });

    return { status: "ok", message: `Đã hủy kích hoạt thiết bị ${deviceId}` };
  }

  static async getAICostAnalytics() {
    return await this.adminRepo.getAICostBreakdown();
  }

  static async getAuditLogs(limit = 50) {
    return await this.adminRepo.listAuditLogs(limit);
  }
}
