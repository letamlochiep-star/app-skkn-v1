import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DefenseService } from "@/server/services/defense-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const data = await DefenseService.generateComponent({
      projectId: params.id,
      userId: user.id,
      componentType: "ANSWER_FRAMEWORKS",
      requestId: body.requestId,
    });
    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    return NextResponse.json({ error: "ANSWER_FRAMEWORKS_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
