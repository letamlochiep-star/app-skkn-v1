import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DefenseService } from "@/server/services/defense-service";

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
    const data = await DefenseService.getDefenseState({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    return NextResponse.json({ error: "DEFENSE_STATE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}

export async function POST(
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
    const body = await request.json().catch(() => ({}));
    const { durationMinutes = 7, requestId } = body;

    const data = await DefenseService.createOrUpdatePackage({
      projectId: params.id,
      userId: user.id,
      durationMinutes,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: `Đã khởi tạo gói báo cáo bảo vệ ${durationMinutes} phút thành công`,
      data: { package: data },
    });
  } catch (err) {
    return NextResponse.json({ error: "CREATE_DEFENSE_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
