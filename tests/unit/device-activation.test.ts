import { describe, it, expect, beforeEach } from "vitest";
import { LicenseService } from "@/server/services/license-service";

describe("Device Activation & Device Limit Rules", () => {
  const userId = "teacher-device-test";

  beforeEach(() => {
    LicenseService.clearMemoryLicenseStore();
  });

  it("should successfully activate license on first device", async () => {
    const { plaintextKey, license } = await LicenseService.issueLicense({
      userId,
      maxDevices: 2,
    });

    const res = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-1",
      deviceName: "Laptop Asus",
    });

    expect(res.success).toBe(true);
    expect(res.activeDevicesCount).toBe(1);
    expect(res.maxDevices).toBe(2);
  });

  it("should handle duplicate activation idempotently on the same device", async () => {
    const { plaintextKey } = await LicenseService.issueLicense({
      userId,
      maxDevices: 2,
    });

    // 1st activation
    const res1 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-1",
    });
    expect(res1.success).toBe(true);
    expect(res1.activeDevicesCount).toBe(1);

    // 2nd activation with same installationId
    const res2 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-1",
    });
    expect(res2.success).toBe(true);
    expect(res2.activeDevicesCount).toBe(1); // Does not increment
  });

  it("should allow up to max_devices (2) and BLOCK the 3rd device", async () => {
    const { plaintextKey } = await LicenseService.issueLicense({
      userId,
      maxDevices: 2,
    });

    // Device 1: Allowed
    const res1 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-1",
    });
    expect(res1.success).toBe(true);

    // Device 2: Allowed
    const res2 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-2",
    });
    expect(res2.success).toBe(true);
    expect(res2.activeDevicesCount).toBe(2);

    // Device 3: Blocked
    const res3 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-3",
    });
    expect(res3.success).toBe(false);
    expect(res3.errorCode).toBe("DEVICE_LIMIT_REACHED");
    expect(res3.errorMessage).toContain("tối đa 2 thiết bị");
  });

  it("should free up slot upon deactivation and allow new device", async () => {
    const { plaintextKey } = await LicenseService.issueLicense({
      userId,
      maxDevices: 2,
    });

    const res1 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-1",
    });

    const res2 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-2",
    });

    expect(res2.activeDevicesCount).toBe(2);

    // Deactivate device 1
    const deactRes = await LicenseService.deactivateDevice({
      userId,
      deviceId: res1.deviceId!,
    });
    expect(deactRes.success).toBe(true);

    // Now Device 3 should succeed
    const res3 = await LicenseService.activateLicense({
      userId,
      licenseKey: plaintextKey,
      installationId: "inst-device-3",
    });
    expect(res3.success).toBe(true);
  });
});
