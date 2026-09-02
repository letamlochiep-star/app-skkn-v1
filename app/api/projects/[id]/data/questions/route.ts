import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SmartDataQuestionService } from "@/server/services/smart-data-question-service";

export async function POST(
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
    const body = await request.json().catch(() => ({}));
    const { requestId } = body;

    const result = await SmartDataQuestionService.generateNextQuestions({
      projectId: params.id,
      userId: user.id,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã tạo đợt câu hỏi thông minh thành công",
      data: result,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "DATA_QUESTIONS_FAILED", message: msg }, { status });
  }
}
