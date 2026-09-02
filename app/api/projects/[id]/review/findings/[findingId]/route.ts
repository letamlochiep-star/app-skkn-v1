import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReviewerService } from "@/server/services/reviewer-service";

export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    const data = await ReviewerService.updateFindingStatus({
      projectId: params.id,
      userId: user.id,
      findingId: params.findingId,
      status,
    });

    return NextResponse.json({
      status: "ok",
      message: `Đã cập nhật trạng thái nhận xét thành ${status}`,
      data,
    });
  } catch (err) {
    return NextResponse.json({ error: "UPDATE_FINDING_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
