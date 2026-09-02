import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Guard: Requires the user to own the specified project.
 * Fails with FORBIDDEN if the project does not belong to the user.
 */
export async function requireProjectOwnership(
  projectId: string,
  userId: string
): Promise<boolean> {
  if (!projectId || !userId) {
    throw new Error("BAD_REQUEST: Missing projectId or userId");
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new Error("NOT_FOUND: Project does not exist");
    }

    if (project.user_id !== userId) {
      throw new Error("FORBIDDEN: You do not have permission to access this project");
    }

    return true;
  } catch (err) {
    if (
      (err as Error).message.includes("FORBIDDEN") ||
      (err as Error).message.includes("NOT_FOUND") ||
      (err as Error).message.includes("BAD_REQUEST")
    ) {
      throw err;
    }
    // Fallback if Supabase is offline/testing
    throw new Error(`GUARD_ERROR: Could not verify project ownership (${(err as Error).message})`);
  }
}
