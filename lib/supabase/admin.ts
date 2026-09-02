import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase Admin client with service_role privileges.
 * NEVER expose this client or the service role key to frontend/browser code.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("[Security Violation] createAdminSupabaseClient must NEVER be called in browser environment!");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
