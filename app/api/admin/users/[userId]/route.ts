import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";
import { AdminService } from "@/server/services/admin-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { user: admin } = await requireAdminUser();
    const body = await request.json();
    const { action, planCode, extendDays } = body;

    if (action === "UPGRADE_PLAN") {
      const res = await AdminService.updateUserPlan({
        targetUserId: params.userId,
        planCode,
        adminUserId: admin.id,
      });
      return NextResponse.json(res);
    } else if (action === "EXTEND_TRIAL") {
      const res = await AdminService.extendUserTrial({
        targetUserId: params.userId,
        days: extendDays || 3,
        adminUserId: admin.id,
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_UPDATE_USER_ERROR", message: msg }, { status });
  }
}
