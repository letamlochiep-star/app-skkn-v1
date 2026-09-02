import { describe, it, expect } from "vitest";
import { AdminService } from "@/server/services/admin-service";

describe("Admin Dashboard Metrics (Phase 11)", () => {
  it("should calculate and return system overview metrics", async () => {
    const metrics = await AdminService.getDashboardOverview();
    expect(metrics.totalUsers).toBeGreaterThan(0);
    expect(metrics.activeLicenses).toBeGreaterThan(0);
    expect(metrics.totalProjects).toBeGreaterThan(0);
    expect(metrics.totalAICostUsd).toBeGreaterThan(0);
  });
});
