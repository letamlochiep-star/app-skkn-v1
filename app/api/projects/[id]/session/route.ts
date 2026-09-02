import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectSessionService } from "@/server/services/project-session-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const sessionResult = await ProjectSessionService.buildProjectSession(
      params.id,
      user.id
    );

    return NextResponse.json({
      status: "ok",
      data: sessionResult,
    });
  } catch (err) {
    return NextResponse.json({ error: "SESSION_BUILD_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
