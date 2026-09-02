import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getClientEnv, getServerEnv, clientEnvSchema, serverEnvSchema } from "@/lib/config/env";

describe("Environment Variables Validation (P0 Guardrails)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate client environment variables when valid", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-12345";

    const clientEnv = getClientEnv();
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key-12345");
  });

  it("should throw a clear error when client environment variables are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => getClientEnv()).toThrow("[Config Error] Invalid Client Environment Variables");
  });

  it("should validate server environment variables when valid", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
    process.env.OPENAI_API_KEY = "sk-proj-test-key";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.AI_PRIMARY_PROVIDER = "openai";
    process.env.AI_FALLBACK_PROVIDER = "gemini";

    const serverEnv = getServerEnv();
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-secret");
    expect(serverEnv.OPENAI_API_KEY).toBe("sk-proj-test-key");
    expect(serverEnv.GEMINI_API_KEY).toBe("gemini-test-key");
    expect(serverEnv.AI_PRIMARY_PROVIDER).toBe("openai");
    expect(serverEnv.AI_FALLBACK_PROVIDER).toBe("gemini");
  });

  it("should throw an error when required server secrets are missing", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getServerEnv()).toThrow("[Config Error] Missing or Invalid Server Environment Variables");
  });

  it("should reject invalid AI provider enums", () => {
    const invalidData = {
      SUPABASE_SERVICE_ROLE_KEY: "secret",
      OPENAI_API_KEY: "key1",
      GEMINI_API_KEY: "key2",
      AI_PRIMARY_PROVIDER: "anthropic", // Not supported in Phase 0
    };

    const parsed = serverEnvSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
