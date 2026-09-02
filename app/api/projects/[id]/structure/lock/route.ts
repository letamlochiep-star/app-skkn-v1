import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StructureService } from "@/server/services/structure-service";

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
    const body = await request.json();
    const { structureId, confirmed } = body;

    const data = await StructureService.lockStructure({
      projectId: params.id,
      userId: user.id,
      structureId,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã chốt và khóa khung cấu trúc thành công! Sẵn sàng tạo bộ 18 câu lệnh.",
      data,
    });
  } catch (err) {
    return NextResponse.json({ error: "LOCK_STRUCTURE_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
