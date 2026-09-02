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
    const { candidateId, finalTitle, confirmed } = body;

    const project = await TopicService.lockTopic({
      projectId: params.id,
      userId: user.id,
      candidateId,
      finalTitle,
      confirmed: Boolean(confirmed),
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã chốt tên đề tài chính thức thành công!",
      data: { project },
    });
  } catch (err) {
    return NextResponse.json({ error: "TOPIC_LOCK_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
