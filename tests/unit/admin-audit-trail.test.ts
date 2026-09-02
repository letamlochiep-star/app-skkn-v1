import { describe, it, expect, beforeEach } from "vitest";
import { AdminService } from "@/server/services/admin-service";
import { AdminRepository } from "@/server/repositories/admin-repository";

describe("Admin Audit Trail (Phase 11)", () => {
  beforeEach(() => {
    AdminRepository.clearMemoryAdminStore();
  });

  it("should record and list admin audit trail actions", async () => {
    await AdminService.deactivateDevice({
      deviceId: "dev_999",
      adminUserId: "admin_super",
    });

    const logs = await AdminService.getAuditLogs(10);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("DEVICE_DEACTIVATED");
    expect(logs[0].resourceType).toBe("DEVICE");
    expect(logs[0].resourceId).toBe("dev_999");
  });
});
