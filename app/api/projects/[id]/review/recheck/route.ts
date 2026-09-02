import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReviewerService } from "@/server/services/reviewer-service";

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

    const data = await ReviewerService.runFullReview({
      projectId: params.id,
      userId: user.id,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã rà soát lại toàn bài thành công",
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "RECHECK_FAILED", message: msg }, { status });
  }
}
