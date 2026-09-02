import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectService } from "@/server/services/project-service";

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
    const data = await ProjectService.getProject({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    return NextResponse.json({ error: "NOT_FOUND", message: (err as Error).message }, { status: 404 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { action, newTitle, ...payload } = body;

    let project;
    if (action === "ARCHIVE") {
      project = await ProjectService.archiveProject({ projectId: params.id, userId: user.id });
    } else if (action === "RESTORE") {
      project = await ProjectService.restoreProject({ projectId: params.id, userId: user.id });
    } else if (action === "RENAME" && newTitle) {
      project = await ProjectService.renameProject({ projectId: params.id, userId: user.id, newTitle });
    } else {
      project = await ProjectService.updateProject({ projectId: params.id, userId: user.id, payload });
    }

    return NextResponse.json({ status: "ok", data: project });
  } catch (err) {
    return NextResponse.json({ error: "UPDATE_FAILED", message: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(
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
    await ProjectService.softDeleteProject({
      projectId: params.id,
      userId: user.id,
    });

    return NextResponse.json({ status: "ok", message: "Đã xóa dự án thành công" });
  } catch (err) {
    return NextResponse.json({ error: "DELETE_FAILED", message: (err as Error).message }, { status: 400 });
  }
}
