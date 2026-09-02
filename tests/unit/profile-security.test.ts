import { describe, it, expect, vi } from "vitest";
import { ProfileService } from "@/server/services/profile-service";
import { ProfileRepository } from "@/server/repositories/profile-repository";

describe("Profile & Role Security Guardrails", () => {
  it("should prevent regular users from elevating role to admin", async () => {
    let capturedUpdateData: Record<string, unknown> = {};

    vi.spyOn(ProfileRepository.prototype, "update").mockImplementation(async (id, data) => {
      capturedUpdateData = data as Record<string, unknown>;
      return {
        id,
        email: "teacher@edu.vn",
        fullName: data.fullName || "Teacher A",
        role: "user", // Role remains unchanged
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const maliciousInput = {
      fullName: "Teacher Hacker",
      role: "admin", // Malicious attempt to self-promote to admin
    };

    const updated = await ProfileService.updateProfile("user-123", maliciousInput);

    // Verify role was stripped from the repository update call
    expect(capturedUpdateData.role).toBeUndefined();
    expect(updated.role).toBe("user");
  });

  it("should throw error when updating profile without a valid user ID", async () => {
    await expect(ProfileService.updateProfile("", { fullName: "Name" })).rejects.toThrow(
      "UNAUTHORIZED: User ID is required"
    );
  });
});
