import { hashInstallationId } from "@/server/services/device-hash-service";
import { LicenseService } from "@/server/services/license-service";
import { SubscriptionService } from "@/server/services/subscription-service";

export interface RequireDeviceActivationInput {
  userId: string;
  installationId: string;
}

export class DeviceNotActivatedError extends Error {
  errorCode: string;
  constructor(message: string, errorCode = "DEVICE_NOT_ACTIVATED") {
    super(message);
    this.name = "DeviceNotActivatedError";
    this.errorCode = errorCode;
  }
}

/**
 * Guard: Ensures the current client device has an active activation bound to the user.
 */
export async function requireDeviceActivation(
  input: RequireDeviceActivationInput
): Promise<{ valid: boolean; deviceId?: string }> {
  const { userId, installationId } = input;

  if (!userId || !installationId) {
    throw new DeviceNotActivatedError(
      "Yêu cầu đầy đủ thông tin xác thực thiết bị.",
      "UNAUTHORIZED"
    );
  }

  // Active TRIAL users have baseline pass
  const subStatus = await SubscriptionService.getSubscriptionStatus(userId);
  if (subStatus.isActive && subStatus.planCode === "TRIAL") {
    return { valid: true };
  }

  const deviceHash = hashInstallationId(installationId);
  const devices = await LicenseService.getUserDevices(userId);
  const device = devices.find((d) => d.deviceHash === deviceHash && d.status === "ACTIVE");

  if (!device) {
    throw new DeviceNotActivatedError(
      "Thiết bị này chưa được kích hoạt bản quyền. Vui lòng vào Quản lý Bản quyền để kích hoạt.",
      "DEVICE_NOT_ACTIVATED"
    );
  }

  const activations = await LicenseService.getUserActivations(userId);
  const activeActivation = activations.find((a) => a.deviceId === device.id);

  if (!activeActivation) {
    throw new DeviceNotActivatedError(
      "Thiết bị này đã bị hủy kích hoạt hoặc hết hạn. Vui lòng kích hoạt lại.",
      "DEVICE_NOT_ACTIVATED"
    );
  }

  return { valid: true, deviceId: device.id };
}
