import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DefenseService } from "@/server/services/defense-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = await request.json();
    const { questionId, questionText, answerText, requestId } = body;

    const data = await DefenseService.submitPracticeAnswer({
      projectId: params.id,
      userId: user.id,
      sessionId: params.sessionId,
      questionId,
      questionText,
      answerText,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã đánh giá câu trả lời của giáo viên thành công",
      data,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "PRACTICE_ANSWER_ERROR", message: msg }, { status });
  }
}
