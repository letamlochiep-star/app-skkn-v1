export type LicenseStatus =
  | "ISSUED"
  | "ACTIVE"
  | "EXPIRED"
  | "REVOKED"
  | "SUSPENDED";

export type DeviceStatus = "ACTIVE" | "REVOKED" | "BLOCKED";

export type ActivationStatus = "ACTIVE" | "DEACTIVATED" | "REVOKED";

export type LicenseErrorCode =
  | "LICENSE_INVALID"
  | "LICENSE_NOT_OWNED"
  | "LICENSE_EXPIRED"
  | "LICENSE_REVOKED"
  | "LICENSE_SUSPENDED"
  | "DEVICE_LIMIT_REACHED"
  | "DEVICE_NOT_ACTIVATED"
  | "DEVICE_REVOKED"
  | "ACTIVATION_RATE_LIMITED";

export interface LicenseRecord {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  licenseHash: string;
  status: LicenseStatus;
  maxDevices: number;
  activationCount: number;
  issuedAt: string;
  activatedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  deviceHash: string;
  deviceName: string;
  browser?: string;
  os?: string;
  status: DeviceStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LicenseActivationRecord {
  id: string;
  licenseId: string;
  userId: string;
  deviceId: string;
  status: ActivationStatus;
  activatedAt: string;
  deactivatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivateLicenseInput {
  userId: string;
  licenseKey: string;
  installationId: string;
  deviceName?: string;
  browser?: string;
  os?: string;
}

export interface ActivateLicenseResult {
  success: boolean;
  errorCode?: LicenseErrorCode;
  errorMessage?: string;
  licenseId?: string;
  deviceId?: string;
  activationId?: string;
  activeDevicesCount?: number;
  maxDevices?: number;
}
