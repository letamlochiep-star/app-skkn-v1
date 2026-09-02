import { createBrowserClient } from "@supabase/ssr";

// Detect nếu Supabase chưa được cấu hình (local dev không có .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes("your-anon-key");

/**
 * Creates a Supabase client for browser components.
 * Throws a user-friendly error when Supabase is not yet configured.
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "SUPABASE_NOT_CONFIGURED"
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}