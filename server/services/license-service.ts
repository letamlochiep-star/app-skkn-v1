import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashInstallationId } from "@/server/services/device-hash-service";
import {
  generateLicenseKey,
  hashLicenseKey,
  normalizeLicenseKey,
} from "@/server/services/license-generator";
import type {
  LicenseRecord,
  DeviceRecord,
  LicenseActivationRecord,
  ActivateLicenseInput,
  ActivateLicenseResult,
} from "@/types/license";

// In-memory data structures for fast offline/test execution
const memoryLicenses: LicenseRecord[] = [];
const memoryDevices: DeviceRecord[] = [];
const memoryActivations: LicenseActivationRecord[] = [];
const activationAttempts = new Map<string, { count: number; firstAttemptTime: number }>();

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export class LicenseService {
  /**
   * Issues a new license key for a user (One-time key reveal)
   */
  static async issueLicense(input: {
    userId: string;
    subscriptionId?: string;
    maxDevices?: number;
    durationDays?: number;
  }): Promise<{ plaintextKey: string; license: LicenseRecord }> {
    const plaintextKey = generateLicenseKey();
    const licenseHash = hashLicenseKey(plaintextKey);
    const maxDevices = input.maxDevices ?? 2;
    const durationDays = input.durationDays ?? 365;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const license: LicenseRecord = {
      id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: input.userId,
      subscriptionId: input.subscriptionId || null,
      licenseHash,
      status: "ISSUED",
      maxDevices,
      activationCount: 0,
      issuedAt: now.toISOString(),
      activatedAt: null,
      expiresAt,
      revokedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    memoryLicenses.push(license);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("licenses").insert({
        id: license.id,
        user_id: license.userId,
        subscription_id: license.subscriptionId,
        license_hash: license.licenseHash,
        status: license.status,
        max_devices: license.maxDevices,
        activation_count: license.activationCount,
        issued_at: license.issuedAt,
        expires_at: license.expiresAt,
      });
    } catch {
      // offline/test fallback
    }

    return { plaintextKey, license };
  }

  /**
   * Activates a license on the user's current device
   */
  static async activateLicense(input: ActivateLicenseInput): Promise<ActivateLicenseResult> {
    const { userId, licenseKey, installationId, deviceName, browser, os } = input;

    // 1. Rate Limiting Check
    const rateKey = `rate_${userId}`;
    const nowMs = Date.now();
    const rateData = activationAttempts.get(rateKey) || { count: 0, firstAttemptTime: nowMs };

    if (nowMs - rateData.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
      rateData.count = 0;
      rateData.firstAttemptTime = nowMs;
    }

    rateData.count += 1;
    activationAttempts.set(rateKey, rateData);

    if (rateData.count > RATE_LIMIT_MAX_ATTEMPTS) {
      return {
        success: false,
        errorCode: "ACTIVATION_RATE_LIMITED",
        errorMessage: "Quá nhiều lần thử kích hoạt. Vui lòng đợi 10 phút trước khi thử lại.",
      };
    }

    // 2. Validate Key Format & Hash
    const normalizedKey = normalizeLicenseKey(licenseKey);
    if (!normalizedKey || !normalizedKey.startsWith("SKKN-")) {
      return {
        success: false,
        errorCode: "LICENSE_INVALID",
        errorMessage: "Mã kích hoạt không đúng định dạng (SKKN-XXXX-XXXX-XXXX-XXXX).",
      };
    }

    const keyHash = hashLicenseKey(normalizedKey);

    // 3. Find License by Hash
    let license = memoryLicenses.find((l) => l.licenseHash === keyHash);

    if (!license) {
      try {
        const supabase = createServerSupabaseClient();
        const { data } = await supabase
          .from("licenses")
          .select("*")
          .eq("license_hash", keyHash)
          .single();

        if (data) {
          license = {
            id: data.id,
            userId: data.user_id,
            subscriptionId: data.subscription_id,
            licenseHash: data.license_hash,
            status: data.status,
            maxDevices: data.max_devices,
            activationCount: data.activation_count,
            issuedAt: data.issued_at,
            activatedAt: data.activated_at,
            expiresAt: data.expires_at,
            revokedAt: data.revoked_at,
          };
          memoryLicenses.push(license);
        }
      } catch {
        // fallback
      }
    }

    if (!license) {
      return {
        success: false,
        errorCode: "LICENSE_INVALID",
        errorMessage: "Mã kích hoạt không tồn tại hoặc không hợp lệ.",
      };
    }

    // 4. Check User Ownership
    if (license.userId !== userId) {
      return {
        success: false,
        errorCode: "LICENSE_NOT_OWNED",
        errorMessage: "Mã kích hoạt này không thuộc tài khoản của bạn.",
      };
    }

    // 5. Check License Status
    if (license.status === "REVOKED") {
      return {
        success: false,
        errorCode: "LICENSE_REVOKED",
        errorMessage: "Mã kích hoạt này đã bị thu hồi.",
      };
    }

    if (license.status === "SUSPENDED") {
      return {
        success: false,
        errorCode: "LICENSE_SUSPENDED",
        errorMessage: "Mã kích hoạt đang bị tạm khóa.",
      };
    }

    if (license.expiresAt && new Date(license.expiresAt).getTime() <= nowMs) {
      return {
        success: false,
        errorCode: "LICENSE_EXPIRED",
        errorMessage: "Mã kích hoạt đã hết hạn sử dụng.",
      };
    }

    // 6. Find or Create Device Record
    const deviceHash = hashInstallationId(installationId);
    let device = memoryDevices.find((d) => d.userId === userId && d.deviceHash === deviceHash);

    if (!device) {
      device = {
        id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        deviceHash,
        deviceName: deviceName || "Thiết bị Giáo viên",
        browser: browser || "Trình duyệt Web",
        os: os || "Hệ điều hành",
        status: "ACTIVE",
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
      memoryDevices.push(device);
    } else {
      device.lastSeenAt = new Date().toISOString();
    }

    // 7. Check Active Activations for this License
    const activeActivations = memoryActivations.filter(
      (a) => a.licenseId === license!.id && a.status === "ACTIVE"
    );

    // Idempotency: already active on this device
    const existingActivation = activeActivations.find((a) => a.deviceId === device!.id);
    if (existingActivation) {
      return {
        success: true,
        licenseId: license.id,
        deviceId: device.id,
        activationId: existingActivation.id,
        activeDevicesCount: activeActivations.length,
        maxDevices: license.maxDevices,
      };
    }

    // Check device limit
    if (activeActivations.length >= license.maxDevices) {
      return {
        success: false,
        errorCode: "DEVICE_LIMIT_REACHED",
        errorMessage: `Bạn đã sử dụng tối đa ${license.maxDevices} thiết bị được phép của mã bản quyền này. Vui lòng hủy bớt thiết bị cũ để kích hoạt thiết bị mới.`,
        activeDevicesCount: activeActivations.length,
        maxDevices: license.maxDevices,
      };
    }

    // 8. Create Activation Record
    const activation: LicenseActivationRecord = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      licenseId: license.id,
      userId,
      deviceId: device.id,
      status: "ACTIVE",
      activatedAt: new Date().toISOString(),
    };

    memoryActivations.push(activation);

    license.status = "ACTIVE";
    license.activatedAt = license.activatedAt || activation.activatedAt;
    license.activationCount = activeActivations.length + 1;

    return {
      success: true,
      licenseId: license.id,
      deviceId: device.id,
      activationId: activation.id,
      activeDevicesCount: license.activationCount,
      maxDevices: license.maxDevices,
    };
  }

  /**
   * Deactivates a device from a license, freeing up a device slot
   */
  static async deactivateDevice(input: {
    userId: string;
    deviceId: string;
  }): Promise<{ success: boolean; errorMessage?: string }> {
    const { userId, deviceId } = input;

    const activation = memoryActivations.find(
      (a) => a.userId === userId && a.deviceId === deviceId && a.status === "ACTIVE"
    );

    if (!activation) {
      return { success: false, errorMessage: "Không tìm thấy phiên kích hoạt hợp lệ cho thiết bị này." };
    }

    activation.status = "DEACTIVATED";
    activation.deactivatedAt = new Date().toISOString();

    const license = memoryLicenses.find((l) => l.id === activation.licenseId);
    if (license) {
      const activeCount = memoryActivations.filter(
        (a) => a.licenseId === license.id && a.status === "ACTIVE"
      ).length;
      license.activationCount = activeCount;
    }

    return { success: true };
  }

  /**
   * Revokes a license, immediately invalidating all associated activations
   */
  static async revokeLicense(licenseId: string): Promise<boolean> {
    const license = memoryLicenses.find((l) => l.id === licenseId);
    if (!license) return false;

    license.status = "REVOKED";
    license.revokedAt = new Date().toISOString();

    // Revoke all linked activations
    for (const act of memoryActivations) {
      if (act.licenseId === licenseId) {
        act.status = "REVOKED";
        act.deactivatedAt = license.revokedAt;
      }
    }

    return true;
  }

  /**
   * Reissues a license: revokes old key and issues a replacement key preserving expiration date
   */
  static async reissueLicense(input: {
    userId: string;
    licenseId: string;
  }): Promise<{ success: boolean; newPlaintextKey?: string; errorMessage?: string }> {
    const oldLicense = memoryLicenses.find(
      (l) => l.id === input.licenseId && l.userId === input.userId
    );

    if (!oldLicense) {
      return { success: false, errorMessage: "Không tìm thấy mã bản quyền cũ." };
    }

    // 1. Revoke old key
    await this.revokeLicense(oldLicense.id);

    // 2. Issue replacement key
    const remainingDays = oldLicense.expiresAt
      ? Math.max(1, Math.ceil((new Date(oldLicense.expiresAt).getTime() - Date.now()) / (24 * 3600 * 1000)))
      : 365;

    const { plaintextKey } = await this.issueLicense({
      userId: input.userId,
      subscriptionId: oldLicense.subscriptionId || undefined,
      maxDevices: oldLicense.maxDevices,
      durationDays: remainingDays,
    });

    return {
      success: true,
      newPlaintextKey: plaintextKey,
    };
  }

  /**
   * Retrieves all licenses owned by a user
   */
  static async getUserLicenses(userId: string): Promise<LicenseRecord[]> {
    return memoryLicenses.filter((l) => l.userId === userId);
  }

  /**
   * Retrieves all devices registered by a user
   */
  static async getUserDevices(userId: string): Promise<DeviceRecord[]> {
    return memoryDevices.filter((d) => d.userId === userId);
  }

  /**
   * Retrieves active activations for a user
   */
  static async getUserActivations(userId: string): Promise<LicenseActivationRecord[]> {
    return memoryActivations.filter((a) => a.userId === userId && a.status === "ACTIVE");
  }

  /**
   * Clears in-memory data (used in unit tests)
   */
  static clearMemoryLicenseStore() {
    memoryLicenses.length = 0;
    memoryDevices.length = 0;
    memoryActivations.length = 0;
    activationAttempts.clear();
  }
}
