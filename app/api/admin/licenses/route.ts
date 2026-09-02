import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";
import { AdminService } from "@/server/services/admin-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const licenses = await AdminService.listLicenses();
    return NextResponse.json({ status: "ok", data: { licenses } });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_LICENSES_ERROR", message: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: admin } = await requireAdminUser();
    const body = await request.json();
    const { planCode = "INDIVIDUAL_PRO", count = 1, maxDevices = 2 } = body;

    const res = await AdminService.generateLicenses({
      planCode,
      count,
      maxDevices,
      adminUserId: admin.id,
    });

    return NextResponse.json(res);
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "GENERATE_LICENSES_ERROR", message: msg }, { status });
  }
}
