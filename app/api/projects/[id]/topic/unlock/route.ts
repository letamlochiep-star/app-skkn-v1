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
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const project = await TopicService.unlockTopic({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({
      status: "ok",
      message: "Đã mở khóa tên đề tài để chỉnh sửa lại.",
      data: { project },
    });
  } catch (err) {
    return NextResponse.json({ error: "TOPIC_UNLOCK_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
