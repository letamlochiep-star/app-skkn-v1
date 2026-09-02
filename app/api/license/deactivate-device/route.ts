import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LicenseService } from "@/server/services/license-service";

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
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "ID thiết bị là bắt buộc." },
        { status: 400 }
      );
    }

    const result = await LicenseService.deactivateDevice({
      userId: user.id,
      deviceId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "DEACTIVATE_FAILED", message: result.errorMessage || "Hủy kích hoạt thất bại." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Đã hủy kích hoạt thiết bị thành công.",
    });
  } catch (err) {
    return NextResponse.json({ error: "SERVER_ERROR", message: (err as Error).message }, { status: 500 });
  }
}
