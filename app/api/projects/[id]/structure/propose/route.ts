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
    const body = await request.json().catch(() => ({}));
    const { requestId } = body;

    const data = await StructureService.proposeStructure({
      projectId: params.id,
      userId: user.id,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã đề xuất khung cấu trúc thành công",
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "PROPOSE_STRUCTURE_FAILED", message: msg }, { status });
  }
}
