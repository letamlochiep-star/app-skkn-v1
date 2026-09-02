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
    const data = await DefenseService.startPracticeSession({
      projectId: params.id,
      userId: user.id,
    });
    return NextResponse.json({ status: "ok", message: "Đã tạo phiên luyện tập bảo vệ mới", data });
  } catch (err) {
    return NextResponse.json({ error: "START_PRACTICE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
