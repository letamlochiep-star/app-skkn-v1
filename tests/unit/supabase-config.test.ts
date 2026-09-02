import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@/lib/supabase/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

describe("Supabase Client Architecture & Security Isolation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should initialize browser client when NEXT_PUBLIC credentials are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";

    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("should fail browser client initialization if public URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => createClient()).toThrow("[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL");
  });

  it("should initialize admin client when service role key is present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-proj.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";

    const adminClient = createAdminSupabaseClient();
    expect(adminClient).toBeDefined();
    expect(adminClient.auth).toBeDefined();
  });

  it("should throw if admin client lacks SUPABASE_SERVICE_ROLE_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-proj.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminSupabaseClient()).toThrow(
      "[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  });
});
