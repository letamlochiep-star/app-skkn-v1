import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const subscriptions = [
      {
        id: "sub_1",
        userId: "usr_1",
        userEmail: "nguyen.van.a@thcs-lequydon.edu.vn",
        planCode: "INDIVIDUAL_PRO",
        status: "ACTIVE",
        startedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 335 * 86400000).toISOString(),
        aiRequestsUsed: 84,
        aiRequestsLimit: 500,
      },
      {
        id: "sub_2",
        userId: "usr_2",
        userEmail: "tran.thi.b@thpt-chuvanan.edu.vn",
        planCode: "TRIAL_3D",
        status: "ACTIVE",
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        aiRequestsUsed: 6,
        aiRequestsLimit: 20,
      },
    ];

    return NextResponse.json({ status: "ok", data: { subscriptions } });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_SUBSCRIPTIONS_ERROR", message: msg }, { status });
  }
}
