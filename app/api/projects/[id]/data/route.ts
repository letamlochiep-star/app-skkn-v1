import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataWorkflowService } from "@/server/services/data-workflow-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập." }, { status: 401 });
  }

  try {
    const data = await DataWorkflowService.getDataState({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("TOPIC_NOT_LOCKED") ? 403 : 400;
    return NextResponse.json({ error: "DATA_STATE_ERROR", message: msg }, { status });
  }
}

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
    const { fieldKey, value, sourceType, verificationStatus, evidenceStatus } = body;

    const result = await DataWorkflowService.saveFact({
      projectId: params.id,
      userId: user.id,
      fieldKey,
      value,
      sourceType,
      verificationStatus,
      evidenceStatus,
    });

    return NextResponse.json({ status: "ok", message: "Đã lưu dữ liệu thành công", data: result });
  } catch (err) {
    return NextResponse.json({ error: "SAVE_FACT_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
