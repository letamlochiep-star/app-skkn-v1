import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = {
    email: user?.email || "",
    full_name: "",
    education_level: "SECONDARY",
    subject_group: "MATH",
    school_name: "",
    role: "user",
  };

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      profile = {
        email: data.email || user.email || "",
        full_name: data.full_name || "",
        education_level: data.education_level || "SECONDARY",
        subject_group: data.subject_group || "MATH",
        school_name: data.school_name || "",
        role: data.role || "user",
      };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hồ sơ Sư phạm</h1>
            <p className="text-xs text-slate-500">Thông tin chuyên môn để cá nhân hóa Sáng kiến kinh nghiệm</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Quay lại Bảng điều khiển
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Địa chỉ Email</label>
            <p className="mt-1 text-sm font-semibold text-slate-900">{profile.email}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Vai trò hệ thống (Role)</label>
            <span className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              {profile.role.toUpperCase()} (Được bảo vệ - Không thể tự thay đổi)
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Họ và tên</label>
            <p className="mt-1 text-sm font-semibold text-slate-900">{profile.full_name || "(Chưa cập nhật)"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Cấp học</label>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile.education_level}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Chuyên môn</label>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile.subject_group}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Đơn vị công tác</label>
            <p className="mt-1 text-sm font-semibold text-slate-900">{profile.school_name || "(Chưa cập nhật)"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
