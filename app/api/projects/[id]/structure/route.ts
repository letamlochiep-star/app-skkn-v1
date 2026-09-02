import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StructureService } from "@/server/services/structure-service";

export async function GET(
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
    const data = await StructureService.getStructureState({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("TOPIC_NOT_LOCKED") ? 403 : 400;
    return NextResponse.json({ error: "STRUCTURE_STATE_ERROR", message: msg }, { status });
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
    const { sections } = body;

    const data = await StructureService.saveStructureDraft({
      projectId: params.id,
      userId: user.id,
      sections,
    });

    return NextResponse.json({ status: "ok", message: "Đã lưu nháp cấu trúc thành công", data });
  } catch (err) {
    return NextResponse.json({ error: "SAVE_STRUCTURE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
