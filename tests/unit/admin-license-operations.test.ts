import { describe, it, expect, beforeEach } from "vitest";
import { AdminService } from "@/server/services/admin-service";
import { AdminRepository } from "@/server/repositories/admin-repository";

describe("Admin License & Device Operations (Phase 11)", () => {
  beforeEach(() => {
    AdminRepository.clearMemoryAdminStore();
  });

  it("should generate batch licenses and record audit log", async () => {
    const res = await AdminService.generateLicenses({
      planCode: "INDIVIDUAL_PRO",
      count: 3,
      maxDevices: 2,
      adminUserId: "admin_1",
    });

    expect(res.count).toBe(3);
    expect(res.keys.length).toBe(3);
    expect(res.keys[0]).toMatch(/^SKKN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    const logs = await AdminService.getAuditLogs(10);
    expect(logs[0].action).toBe("LICENSE_GENERATED");
  });

  it("should revoke license key and record audit log", async () => {
    const res = await AdminService.revokeLicense({
      licenseKey: "SKKN-TEST-1234-5678-9999",
      adminUserId: "admin_1",
    });

    expect(res.status).toBe("ok");

    const logs = await AdminService.getAuditLogs(10);
    expect(logs[0].action).toBe("LICENSE_REVOKED");
    expect(logs[0].resourceId).toBe("SKKN-TEST-1234-5678-9999");
  });
});
