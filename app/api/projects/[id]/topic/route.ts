import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopicService } from "@/server/services/topic-service";

export async function GET(
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
    const data = await TopicService.getTopicState({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    return NextResponse.json({ error: "TOPIC_STATE_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
