import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectService } from "@/server/services/project-service";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { requestId, ...payload } = body;

    const project = await ProjectService.createProject({
      userId: user.id,
      payload,
      requestId,
    });

    return NextResponse.json({
      status: "ok",
      message: "Tạo dự án thành công!",
      data: {
        project: {
          id: project.id,
          documentType: project.documentType,
          workingTitle: project.workingTitle,
          workflowStage: project.workflowStage,
          status: project.status,
        },
        next: `/projects/${project.id}/topic`,
      },
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("QUOTA") ? 403 : 400;
    return NextResponse.json({ error: "CREATE_PROJECT_FAILED", message: msg }, { status });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const documentType = searchParams.get("documentType") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result = await ProjectService.listProjects({
    userId: user.id,
    status,
    documentType,
    search,
    page,
    limit,
  });

  return NextResponse.json({
    status: "ok",
    data: result,
  });
}
