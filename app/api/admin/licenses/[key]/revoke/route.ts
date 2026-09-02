import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";
import { AdminService } from "@/server/services/admin-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { user: admin } = await requireAdminUser();
    const res = await AdminService.revokeLicense({
      licenseKey: params.key,
      adminUserId: admin.id,
    });
    return NextResponse.json(res);
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "REVOKE_LICENSE_ERROR", message: msg }, { status });
  }
}
