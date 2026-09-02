import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopicService } from "@/server/services/topic-service";

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
    const body = await request.json();
    const { title, requestId } = body;

    const result = await TopicService.analyzeTopic({
      projectId: params.id,
      userId: user.id,
      title,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Phân tích tên đề tài thành công!",
      data: result,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "TOPIC_ANALYZE_FAILED", message: msg }, { status });
  }
}
