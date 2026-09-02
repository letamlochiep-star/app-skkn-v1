import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WriterService } from "@/server/services/writer-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; promptNumber: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const num = parseInt(params.promptNumber, 10);
    if (isNaN(num) || num < 1 || num > 18) {
      return NextResponse.json({ error: "INVALID_PROMPT_NUMBER", message: "Số thứ tự câu lệnh không hợp lệ (1..18)" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { requestId, revisionMode } = body;

    const data = await WriterService.generatePromptContent({
      projectId: params.id,
      userId: user.id,
      promptNumber: num,
      requestId,
      revisionMode,
    });

    return NextResponse.json({
      status: "ok",
      message: `Đã sinh nội dung Prompt ${num} thành công`,
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "GENERATE_SECTION_FAILED", message: msg }, { status });
  }
}
