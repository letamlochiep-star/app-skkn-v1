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
    const body = await request.json();
    const { confirmed } = body;

    const data = await DefenseService.completeDefensePackage({
      projectId: params.id,
      userId: user.id,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã hoàn thành chuẩn bị Báo cáo bảo vệ trước Ban Giám Khảo!",
      data: { package: data },
    });
  } catch (err) {
    return NextResponse.json({ error: "COMPLETE_DEFENSE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
