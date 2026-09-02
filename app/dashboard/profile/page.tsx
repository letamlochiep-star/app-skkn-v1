import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { Key, ShieldCheck, User } from "lucide-react";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  let profile = {
    email: user?.email || "giaovien@edu.vn",
    full_name: user?.fullName || "Thầy/Cô Giáo",
    education_level: user?.educationLevel || "SECONDARY",
    subject_group: user?.subjectGroup || "MATH",
    school_name: user?.schoolName || "Trường THCS / THPT",
    role: user?.role || "user",
  };

  if (user?.id) {
    try {
      const dbProfile = await ProfileRepository.getProfileById(user.id);
      if (dbProfile) {
        profile = {
          email: dbProfile.email || profile.email,
          full_name: dbProfile.fullName || profile.full_name,
          education_level: dbProfile.educationLevel || profile.education_level,
          subject_group: dbProfile.subjectGroup || profile.subject_group,
          school_name: profile.school_name,
          role: dbProfile.role || profile.role,
        };
      }
    } catch {
      // Dùng fallback session
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Hồ sơ Sư phạm Giáo viên</h1>
                <p className="text-xs text-slate-500">Thông tin cá nhân hóa cho Sáng kiến kinh nghiệm</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về Bảng điều khiển
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Địa chỉ Email</label>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile.email}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">Vai trò hệ thống (Role)</label>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {profile.role.toUpperCase()} (Tài khoản giáo viên chính thức)
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">Họ và tên</label>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile.full_name}</p>
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
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile.school_name}</p>
            </div>
          </div>
        </div>

        {/* Cấu hình Gemini Key */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Google Gemini API Key</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Thầy/Cô có thể cập nhật danh sách Google Gemini API Key (mỗi dòng 1 key) bất cứ lúc nào. Hệ thống sẽ tự động xoay vòng khi gọi AI.
          </p>
          <Link
            href="/setup-api-key"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
          >
            Quản lý Gemini API Keys →
          </Link>
        </div>
      </div>
    </div>
  );
}