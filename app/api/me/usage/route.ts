import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UsageService } from "@/server/services/usage-service";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const usage = await UsageService.getUsageSummary(user.id);

  return NextResponse.json({
    status: "ok",
    data: usage,
  });
}
