import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PromptSetService } from "@/server/services/prompt-set-service";

export async function PATCH(
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

    const body = await request.json();
    const { promptText } = body;

    if (!promptText || typeof promptText !== "string" || promptText.trim().length < 10) {
      return NextResponse.json({ error: "INVALID_PROMPT_TEXT", message: "Nội dung câu lệnh quá ngắn" }, { status: 400 });
    }

    const data = await PromptSetService.updatePrompt({
      projectId: params.id,
      userId: user.id,
      promptNumber: num,
      promptText,
    });

    return NextResponse.json({
      status: "ok",
      message: `Đã cập nhật Prompt ${num} thành công`,
      data,
    });
  } catch (err) {
    return NextResponse.json({ error: "UPDATE_PROMPT_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
