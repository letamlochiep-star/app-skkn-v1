import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReviewWorkflowService } from "@/server/services/review-workflow-service";

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
    const { confirmed } = body;

    const project = await ReviewWorkflowService.completeReviewStage({
      projectId: params.id,
      userId: user.id,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã hoàn thành Bước 5 (Rà soát & Đánh giá)! Dự án sẵn sàng chuyển sang Bước 6 (Hoàn thiện hồ sơ).",
      data: { project },
    });
  } catch (err) {
    return NextResponse.json({ error: "COMPLETE_REVIEW_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
