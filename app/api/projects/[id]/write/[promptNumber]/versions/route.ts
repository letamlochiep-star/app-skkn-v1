import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WriterService } from "@/server/services/writer-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; promptNumber: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const num = parseInt(params.promptNumber, 10);
    if (isNaN(num) || num < 1 || num > 18) {
      return NextResponse.json({ error: "INVALID_PROMPT_NUMBER" }, { status: 400 });
    }

    const versions = await WriterService.getPromptVersions({
      projectId: params.id,
      userId: user.id,
      promptNumber: num,
    });

    return NextResponse.json({ status: "ok", data: { versions } });
  } catch (err) {
    return NextResponse.json({ error: "GET_VERSIONS_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
