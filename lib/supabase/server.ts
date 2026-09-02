import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isServerSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co") &&
  (
    (supabaseAnonKey.startsWith("eyJ") && supabaseAnonKey.length > 50) ||
    (supabaseAnonKey.startsWith("sb_publishable_") && supabaseAnonKey.length > 20)
  );

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Automatically synchronizes auth cookies.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  if (!isServerSupabaseConfigured) {
    throw new Error("[Supabase Server] Missing or invalid NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from Server Component - safe to ignore
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Called from Server Component - safe to ignore
        }
      },
    },
  });
}