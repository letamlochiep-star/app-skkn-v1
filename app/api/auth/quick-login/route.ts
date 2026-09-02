import { NextResponse, type NextRequest } from "next/server";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { SESSION_COOKIE_NAME, type AppUserSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "giaovien.demo@skkn.edu.vn").trim().toLowerCase();
    const fullName = (body.fullName || "Thầy/Cô Giáo").trim();
    const educationLevel = body.educationLevel || "SECONDARY";
    const subjectGroup = body.subjectGroup || "MATH";
    const schoolName = body.schoolName || "Trường THCS / THPT";

    // 1. Tạo hoặc lấy ID người dùng ổn định dựa trên email
    const userId = "usr_" + Buffer.from(email).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);

    const userSession: AppUserSession = {
      id: userId,
      email,
      fullName,
      role: email.includes("admin") ? "admin" : "user",
      educationLevel,
      subjectGroup,
      schoolName,
    };

    // 2. Lưu profile vào In-Memory Repository
    try {
      await ProfileRepository.upsertProfile({
        id: userId,
        email,
        fullName,
        role: userSession.role as "admin" | "user",
        educationLevel,
        subjectGroup,
      });
    } catch {
      // Bỏ qua lỗi DB nếu chạy hoàn toàn client/memory
    }

    // 3. Đặt cookie session
    const response = NextResponse.json({
      success: true,
      user: userSession,
      redirect: "/dashboard",
    });

    const cookieValue = encodeURIComponent(JSON.stringify(userSession));
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: cookieValue,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 ngày
      sameSite: "lax",
      httpOnly: false, // Để client cũng đọc được
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Lỗi xử lý đăng nhập" },
      { status: 500 }
    );
  }
}