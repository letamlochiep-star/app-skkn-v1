import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "giaovien.demo@skkn.edu.vn").trim().toLowerCase();
    const fullName = (body.fullName || "Thầy/Cô Giáo").trim();
    const defaultPassword = "SkknPassword2026!@#";

    const admin = createAdminSupabaseClient();

    // 1. Kiểm tra user đã tồn tại chưa hoặc tạo mới
    const { data: usersList } = await admin.auth.admin.listUsers();
    let user = usersList?.users?.find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          education_level: body.educationLevel || "SECONDARY",
          subject_group: body.subjectGroup || "MATH",
          school_name: body.schoolName || "Trường THCS / THPT",
        },
      });

      if (createErr) {
        // Fallback: Nếu đã có nhưng không list được, cập nhật password
        await admin.auth.admin.updateUserById(email, { password: defaultPassword });
      } else {
        user = created.user;
      }
    } else {
      // Đảm bảo mật khẩu đồng bộ để đăng nhập
      await admin.auth.admin.updateUserById(user.id, {
        password: defaultPassword,
        email_confirm: true,
      });
    }

    // 2. Tạo session bằng createServerSupabaseClient
    const serverSupabase = createServerSupabaseClient();
    const { data: sessionData, error: sessionErr } = await serverSupabase.auth.signInWithPassword({
      email,
      password: defaultPassword,
    });

    if (sessionErr) {
      return NextResponse.json({ success: false, error: sessionErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: sessionData.user,
      redirect: "/dashboard",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Lỗi xử lý đăng nhập nhanh" },
      { status: 500 }
    );
  }
}