import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdminUser } from "@/server/guards/require-admin";
import * as serverSupabase from "@/lib/supabase/server";

describe("Admin Guard Security (Phase 11)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should BLOCK unauthenticated access with UNAUTHORIZED", async () => {
    vi.spyOn(serverSupabase, "createServerSupabaseClient").mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);

    await expect(requireAdminUser()).rejects.toThrow("UNAUTHORIZED");
  });

  it("should BLOCK normal teacher with FORBIDDEN_ADMIN_ONLY", async () => {
    vi.spyOn(serverSupabase, "createServerSupabaseClient").mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "teacher@school.edu.vn" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "u1", role: "TEACHER" } }),
          }),
        }),
      }),
    } as any);

    await expect(requireAdminUser()).rejects.toThrow("FORBIDDEN_ADMIN_ONLY");
  });

  it("should ALLOW user with role = ADMIN", async () => {
    vi.spyOn(serverSupabase, "createServerSupabaseClient").mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin1", email: "admin@skkn-ai.edu.vn" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "admin1", role: "ADMIN" } }),
          }),
        }),
      }),
    } as any);

    const res = await requireAdminUser();
    expect(res.user.id).toBe("admin1");
  });
});
