import { describe, it, expect, beforeEach } from "vitest";
import { AdminService } from "@/server/services/admin-service";
import { AdminRepository } from "@/server/repositories/admin-repository";

describe("Admin User & Trial Management (Phase 11)", () => {
  beforeEach(() => {
    AdminRepository.clearMemoryAdminStore();
  });

  it("should extend user trial and record audit log", async () => {
    const res = await AdminService.extendUserTrial({
      targetUserId: "user_test_trial",
      days: 3,
      adminUserId: "admin_1",
    });

    expect(res.status).toBe("ok");
    expect(res.message).toContain("3 ngày dùng thử");

    const logs = await AdminService.getAuditLogs(10);
    expect(logs[0].action).toBe("TRIAL_EXTENDED");
    expect(logs[0].resourceId).toBe("user_test_trial");
  });

  it("should upgrade user subscription plan and record audit log", async () => {
    const res = await AdminService.updateUserPlan({
      targetUserId: "user_test_plan",
      planCode: "INDIVIDUAL_PRO",
      adminUserId: "admin_1",
    });

    expect(res.status).toBe("ok");

    const logs = await AdminService.getAuditLogs(10);
    expect(logs[0].action).toBe("PLAN_UPGRADED");
    expect(logs[0].resourceId).toBe("user_test_plan");
  });
});
