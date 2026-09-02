import { describe, it, expect, beforeEach } from "vitest";
import { LicenseService } from "@/server/services/license-service";

describe("License Activation Rate Limiting", () => {
  const userId = "teacher-brute-force-test";

  beforeEach(() => {
    LicenseService.clearMemoryLicenseStore();
  });

  it("should trigger rate limit after 5 failed activation attempts", async () => {
    // 5 invalid attempts
    for (let i = 0; i < 5; i++) {
      const res = await LicenseService.activateLicense({
        userId,
        licenseKey: `SKKN-FAKE-KEY${i}-0000-0000`,
        installationId: "inst-1",
      });
      expect(res.errorCode).toBe("LICENSE_INVALID");
    }

    // 6th attempt should be blocked by rate limit
    const res6 = await LicenseService.activateLicense({
      userId,
      licenseKey: "SKKN-FAKE-KEY6-0000-0000",
      installationId: "inst-1",
    });

    expect(res6.success).toBe(false);
    expect(res6.errorCode).toBe("ACTIVATION_RATE_LIMITED");
    expect(res6.errorMessage).toContain("Quá nhiều lần thử kích hoạt");
  });
});
