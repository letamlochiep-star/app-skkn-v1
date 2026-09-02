import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WriterWorkflowService } from "@/server/services/writer-workflow-service";

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

    const project = await WriterWorkflowService.completeWriterStage({
      projectId: params.id,
      userId: user.id,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã hoàn thành phần viết nội dung! Dự án sẵn sàng chuyển sang Bước 5 (Rà soát & Đánh giá).",
      data: { project },
    });
  } catch (err) {
    return NextResponse.json({ error: "COMPLETE_WRITER_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
