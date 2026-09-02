import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Guard: Requires an authenticated user from session.
 * Throws an Error with 401 status code message if unauthenticated.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("UNAUTHORIZED: Authentication required");
    }

    return {
      id: user.id,
      email: user.email || "",
      role: user.user_metadata?.role || "USER",
    };
  } catch (err) {
    if ((err as Error).message.includes("UNAUTHORIZED")) {
      throw err;
    }
    // If Supabase is not reachable or headers are absent (e.g., in unit test without cookie headers)
    throw new Error(`UNAUTHORIZED: Authentication verification failed (${(err as Error).message})`);
  }
}
