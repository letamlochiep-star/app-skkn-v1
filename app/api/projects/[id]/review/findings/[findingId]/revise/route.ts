import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReviewerService } from "@/server/services/reviewer-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; findingId: string } }
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

    const data = await ReviewerService.generateTargetedRevision({
      projectId: params.id,
      userId: user.id,
      findingId: params.findingId,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã tạo phiên bản chỉnh sửa theo nhận xét thành công",
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "TARGETED_REVISION_FAILED", message: msg }, { status });
  }
}
