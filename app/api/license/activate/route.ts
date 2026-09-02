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
    const { licenseKey, installationId, deviceName, browser, os } = body;

    if (!licenseKey || !installationId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Mã kích hoạt và định danh thiết bị là bắt buộc." },
        { status: 400 }
      );
    }

    const result = await LicenseService.activateLicense({
      userId: user.id,
      licenseKey,
      installationId,
      deviceName,
      browser,
      os,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.errorCode || "ACTIVATION_FAILED",
          message: result.errorMessage || "Kích hoạt bản quyền thất bại.",
          activeDevicesCount: result.activeDevicesCount,
          maxDevices: result.maxDevices,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Kích hoạt bản quyền trên thiết bị thành công!",
      data: result,
    });
  } catch (err) {
    return NextResponse.json({ error: "SERVER_ERROR", message: (err as Error).message }, { status: 500 });
  }
}
