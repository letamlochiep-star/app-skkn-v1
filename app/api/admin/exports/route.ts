import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/server/guards/require-admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const exports = [
      { id: "exp_1", projectTitle: "Nâng cao năng lực giải toán hình học 8", userEmail: "nguyen.van.a@thcs-lequydon.edu.vn", exportType: "DOCX", mode: "FINAL", status: "READY", sizeKb: 142.5, createdAt: new Date().toISOString() },
      { id: "exp_2", projectTitle: "Đồ dùng dạy học tự làm môn KHTN", userEmail: "tran.thi.b@thpt-chuvanan.edu.vn", exportType: "DEFENSE_PPTX", mode: "FINAL", status: "READY", sizeKb: 284.1, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "exp_3", projectTitle: "Ứng dụng sơ đồ tư duy môn Lịch sử", userEmail: "teacher3@school.edu.vn", exportType: "FULL_PDF", mode: "DRAFT", status: "READY", sizeKb: 98.2, createdAt: new Date(Date.now() - 7200000).toISOString() },
    ];

    return NextResponse.json({ status: "ok", data: { exports } });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("UNAUTHORIZED") ? 401 : msg.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: "ADMIN_EXPORTS_ERROR", message: msg }, { status });
  }
}
