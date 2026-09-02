import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PromptSetService } from "@/server/services/prompt-set-service";

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

    const data = await PromptSetService.completeStep2({
      projectId: params.id,
      userId: user.id,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã hoàn thành Bước 2 (Cấu trúc & 18 Câu lệnh)! Dự án sẵn sàng chuyển sang Bước 4 (Soạn thảo).",
      data,
    });
  } catch (err) {
    return NextResponse.json({ error: "COMPLETE_STEP2_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
