import { describe, it, expect } from "vitest";
import { requireProjectOwnership } from "@/server/guards/project-guard";
import { requireEntitlement } from "@/server/guards/entitlement-guard";
import { requireAuthenticatedUser } from "@/server/guards/auth-guard";

describe("Server Guards Foundation", () => {
  describe("Project Ownership Guard", () => {
    it("should throw BAD_REQUEST when projectId or userId is missing", async () => {
      await expect(requireProjectOwnership("", "user-123")).rejects.toThrow("BAD_REQUEST: Missing projectId or userId");
      await expect(requireProjectOwnership("proj-123", "")).rejects.toThrow("BAD_REQUEST: Missing projectId or userId");
    });
  });

  describe("Entitlement Guard (Phase 0 Placeholder)", () => {
    it("should allow feature access for valid user ID", async () => {
      const result = await requireEntitlement("user-123", "AI_DRAFT_GENERATE");
      expect(result.allowed).toBe(true);
      expect(result.featureKey).toBe("AI_DRAFT_GENERATE");
      expect(result.remainingQuota).toBeGreaterThan(0);
    });

    it("should throw UNAUTHORIZED when user ID is missing", async () => {
      await expect(requireEntitlement("", "AI_DRAFT_GENERATE")).rejects.toThrow(
        "UNAUTHORIZED: User ID required for entitlement check"
      );
    });
  });

  describe("Authentication Guard", () => {
    it("should reject unauthenticated calls when no user session exists", async () => {
      // In test context without cookies/session, it throws UNAUTHORIZED
      await expect(requireAuthenticatedUser()).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
