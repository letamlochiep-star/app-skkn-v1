import { describe, it, expect, beforeEach } from "vitest";
import { LicenseService } from "@/server/services/license-service";

describe("License Concurrency Safety", () => {
  const userId = "teacher-concurrency-license";

  beforeEach(() => {
    LicenseService.clearMemoryLicenseStore();
  });

  it("should enforce max_devices under concurrent activations from distinct devices", async () => {
    const { plaintextKey } = await LicenseService.issueLicense({
      userId,
      maxDevices: 2,
    });

    // 5 concurrent activation requests from 5 different devices
    const promises = Array.from({ length: 5 }).map((_, i) =>
      LicenseService.activateLicense({
        userId,
        licenseKey: plaintextKey,
        installationId: `inst-concurrent-device-${i}`,
      })
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    expect(successful.length).toBeLessThanOrEqual(2);
    expect(failed.length).toBeGreaterThanOrEqual(3);
    failed.forEach((f) => {
      expect(f.errorCode).toBe("DEVICE_LIMIT_REACHED");
    });
  });
});
