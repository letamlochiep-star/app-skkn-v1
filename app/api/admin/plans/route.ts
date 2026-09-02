import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const plans = [
      {
        id: "plan_trial",
        code: "TRIAL_3D",
        name: "Gói Trải Nghiệm 3 Ngày",
        status: "ACTIVE",
        durationDays: 3,
        projectLimit: 1,
        aiRequestLimit: 20,
        deviceLimit: 1,
        features: ["CREATE_PROJECT", "AI_GENERATE", "AI_REVIEW"],
      },
      {
        id: "plan_pro",
        code: "INDIVIDUAL_PRO",
        name: "Gói Giáo Viên Chuyên Nghiệp",
        status: "ACTIVE",
        durationDays: 365,
        projectLimit: 10,
        aiRequestLimit: 500,
        deviceLimit: 2,
        features: ["CREATE_PROJECT", "AI_GENERATE", "AI_REVIEW", "EXPORT_DOCX", "EXPORT_PDF", "EXPORT_PPTX", "DEFENSE_PRESENTATION", "DEVICE_ACTIVATION"],
      },
      {
        id: "plan_enterprise",
        code: "SCHOOL_ENTERPRISE",
        name: "Gói Trường Học & Tổ Chuyên Môn",
        status: "ACTIVE",
        durationDays: 365,
        projectLimit: 100,
        aiRequestLimit: 5000,
        deviceLimit: 10,
        features: ["CREATE_PROJECT", "AI_GENERATE", "AI_REVIEW", "EXPORT_DOCX", "EXPORT_PDF", "EXPORT_PPTX", "DEFENSE_PRESENTATION", "DEVICE_ACTIVATION", "TEAM_COLLABORATION"],
      },
    ];

    return NextResponse.json({ status: "ok", data: { plans } });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_PLANS_ERROR", message: msg }, { status });
  }
}
