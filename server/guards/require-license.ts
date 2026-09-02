import { LicenseService } from "@/server/services/license-service";
import { SubscriptionService } from "@/server/services/subscription-service";

export interface RequireLicenseInput {
  userId: string;
  installationId?: string;
}

export class LicenseRequiredError extends Error {
  errorCode: string;
  constructor(message: string, errorCode = "LICENSE_REQUIRED") {
    super(message);
    this.name = "LicenseRequiredError";
    this.errorCode = errorCode;
  }
}

/**
 * Guard: Ensures user has an active license or is within active trial.
 */
export async function requireLicense(input: RequireLicenseInput): Promise<{ valid: boolean; licenseId?: string }> {
  const { userId } = input;

  if (!userId) {
    throw new LicenseRequiredError("Yêu cầu đăng nhập để xác thực bản quyền.", "UNAUTHORIZED");
  }

  // If user is on an active TRIAL, license key is not required
  const subStatus = await SubscriptionService.getSubscriptionStatus(userId);
  if (subStatus.isActive && subStatus.planCode === "TRIAL") {
    return { valid: true };
  }

  const licenses = await LicenseService.getUserLicenses(userId);
  const activeLicense = licenses.find(
    (l) =>
      (l.status === "ACTIVE" || l.status === "ISSUED") &&
      (!l.expiresAt || new Date(l.expiresAt).getTime() > Date.now())
  );

  if (!activeLicense) {
    throw new LicenseRequiredError(
      "Tính năng này yêu cầu mã bản quyền đã được kích hoạt. Vui lòng nâng cấp gói.",
      "LICENSE_INVALID"
    );
  }

  return { valid: true, licenseId: activeLicense.id };
}
