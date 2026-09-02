import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LicenseService } from "@/server/services/license-service";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const licenses = await LicenseService.getUserLicenses(user.id);
  const devices = await LicenseService.getUserDevices(user.id);
  const activations = await LicenseService.getUserActivations(user.id);

  return NextResponse.json({
    status: "ok",
    data: {
      licenses: licenses.map((l) => ({
        id: l.id,
        status: l.status,
        maxDevices: l.maxDevices,
        activationCount: l.activationCount,
        issuedAt: l.issuedAt,
        activatedAt: l.activatedAt,
        expiresAt: l.expiresAt,
      })),
      devices,
      activations,
    },
  });
}
