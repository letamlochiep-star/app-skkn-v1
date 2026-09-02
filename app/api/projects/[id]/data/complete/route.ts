import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataWorkflowService } from "@/server/services/data-workflow-service";

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

    const project = await DataWorkflowService.completeDataStage({
      projectId: params.id,
      userId: user.id,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã hoàn thành thu thập dữ liệu thực tế. Dự án sẵn sàng chuyển sang Bước 3 (Khung cấu trúc)!",
      data: { project },
    });
  } catch (err) {
    return NextResponse.json({ error: "DATA_COMPLETE_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
