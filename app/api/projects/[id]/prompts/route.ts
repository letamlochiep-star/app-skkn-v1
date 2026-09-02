import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PromptSetService } from "@/server/services/prompt-set-service";

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
    const data = await PromptSetService.getPromptSetState({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    return NextResponse.json({ error: "PROMPT_STATE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
