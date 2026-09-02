import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataWorkflowService } from "@/server/services/data-workflow-service";

export async function PATCH(
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
    const { facts } = body;

    if (!Array.isArray(facts)) {
      return NextResponse.json({ error: "INVALID_BODY", message: "Danh sách facts phải là một mảng" }, { status: 400 });
    }

    const result = await DataWorkflowService.saveBatchFacts({
      projectId: params.id,
      userId: user.id,
      facts,
    });

    return NextResponse.json({ status: "ok", message: "Đã lưu hàng loạt dữ liệu thành công", data: result });
  } catch (err) {
    return NextResponse.json({ error: "BATCH_SAVE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
