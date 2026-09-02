import { describe, it, expect, beforeEach } from "vitest";
import { LicenseService } from "@/server/services/license-service";

describe("License Lifecycle: Ownership, Revocation, Reissue & Expiry", () => {
  beforeEach(() => {
    LicenseService.clearMemoryLicenseStore();
  });

  it("should BLOCK activation when user attempts to activate another user's license", async () => {
    // Issue license to user A
    const { plaintextKey } = await LicenseService.issueLicense({
      userId: "user-owner-A",
      maxDevices: 2,
    });

    // User B attempts to activate user A's key
    const res = await LicenseService.activateLicense({
      userId: "user-intruder-B",
      licenseKey: plaintextKey,
      installationId: "inst-device-B",
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("LICENSE_NOT_OWNED");
  });

  it("should revoke license and block subsequent activations", async () => {
    const { plaintextKey, license } = await LicenseService.issueLicense({
      userId: "user-test",
      maxDevices: 2,
    });

    // Revoke license
    const revoked = await LicenseService.revokeLicense(license.id);
    expect(revoked).toBe(true);

    // Attempt activation
    const res = await LicenseService.activateLicense({
      userId: "user-test",
      licenseKey: plaintextKey,
      installationId: "inst-device-1",
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("LICENSE_REVOKED");
  });

  it("should reissue license, revoking old key and providing new replacement key", async () => {
    const { plaintextKey: oldKey, license: oldLicense } = await LicenseService.issueLicense({
      userId: "user-test",
      maxDevices: 2,
      durationDays: 30,
    });

    const reissueResult = await LicenseService.reissueLicense({
      userId: "user-test",
      licenseId: oldLicense.id,
    });

    expect(reissueResult.success).toBe(true);
    expect(reissueResult.newPlaintextKey).toBeDefined();
    expect(reissueResult.newPlaintextKey).not.toBe(oldKey);

    // Old key is now revoked
    const resOld = await LicenseService.activateLicense({
      userId: "user-test",
      licenseKey: oldKey,
      installationId: "inst-device-1",
    });
    expect(resOld.errorCode).toBe("LICENSE_REVOKED");

    // New key activates successfully
    const resNew = await LicenseService.activateLicense({
      userId: "user-test",
      licenseKey: reissueResult.newPlaintextKey!,
      installationId: "inst-device-1",
    });
    expect(resNew.success).toBe(true);
  });
});
