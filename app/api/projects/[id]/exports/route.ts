import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ExportService } from "@/server/services/export-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const data = await ExportService.getExportState({
      projectId: params.id,
      userId: user.id,
    });
    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    return NextResponse.json({ error: "EXPORT_STATE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = await request.json();
    const { exportType, mode = "FINAL", templateCode, options, requestId } = body;

    const data = await ExportService.generateExport({
      projectId: params.id,
      userId: user.id,
      exportType,
      mode,
      templateCode,
      options,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: `Đã tạo tệp ${exportType} thành công!`,
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("NOT_ALLOWED") ? 403 : 400;
    return NextResponse.json({ error: "EXPORT_FAILED", message: msg }, { status });
  }
}
