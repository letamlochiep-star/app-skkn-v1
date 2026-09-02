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
    const body = await request.json().catch(() => ({}));
    const { requestId } = body;

    const data = await PromptSetService.generatePromptSet({
      projectId: params.id,
      userId: user.id,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã tạo bộ đúng 18 câu lệnh thành công",
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "GENERATE_PROMPTS_FAILED", message: msg }, { status });
  }
}
