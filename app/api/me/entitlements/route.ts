import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EntitlementService } from "@/server/services/entitlement-service";
import type { FeatureCode } from "@/types/entitlement";

const CHECK_FEATURES: FeatureCode[] = [
  "DASHBOARD_ACCESS",
  "PROFILE_ACCESS",
  "CREATE_PROJECT",
  "AI_GENERATE",
  "AI_REVIEW",
  "UPLOAD_FILE",
  "EXPORT_DOCX",
  "EXPORT_PDF",
  "EXPORT_PPTX",
  "DEFENSE_PRESENTATION",
];

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  for (const feature of CHECK_FEATURES) {
    results[feature] = await EntitlementService.checkEntitlement({
      userId: user.id,
      feature,
    });
  }

  return NextResponse.json({
    status: "ok",
    data: results,
  });
}
