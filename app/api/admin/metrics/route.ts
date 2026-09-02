import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";
import { AdminService } from "@/server/services/admin-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const metrics = await AdminService.getDashboardOverview();
    return NextResponse.json({ status: "ok", data: metrics });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_METRICS_ERROR", message: msg }, { status });
  }
}
