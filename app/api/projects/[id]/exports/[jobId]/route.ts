import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ExportRepository } from "@/server/repositories/export-repository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; jobId: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const exportRepo = new ExportRepository();
  const job = await exportRepo.findJobById(params.jobId);
  if (!job || job.projectId !== params.id) {
    return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", data: { job } });
}
