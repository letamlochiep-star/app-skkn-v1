import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DocumentAssemblyService } from "@/server/services/document-assembly-service";

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
    const draft = await DocumentAssemblyService.assembleDraftDocument({
      projectId: params.id,
      userId: user.id,
    });

    const consistency = await DocumentAssemblyService.checkDraftConsistency({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã ghép nối bản thảo toàn văn thành công",
      data: { draft, consistency },
    });
  } catch (err) {
    return NextResponse.json({ error: "ASSEMBLE_DRAFT_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
