import { describe, it, expect } from "vitest";
import { AuthService } from "@/server/services/auth-service";

describe("Auth Service Foundation & Validation", () => {
  it("should fail sign up when email or password is missing", async () => {
    const res1 = await AuthService.signUp({ email: "", password: "password123", fullName: "Teacher" });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain("Email và mật khẩu là bắt buộc");

    const res2 = await AuthService.signUp({ email: "teacher@edu.vn", password: "", fullName: "Teacher" });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("Email và mật khẩu là bắt buộc");
  });

  it("should fail sign in when credentials are empty", async () => {
    const res = await AuthService.signIn({ email: "", password: "" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Email và mật khẩu là bắt buộc");
  });

  it("should fail password reset request when email is empty", async () => {
    const res = await AuthService.requestPasswordReset("");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Email là bắt buộc");
  });
});
