"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    educationLevel: "SECONDARY",
    subjectGroup: "MATH",
    schoolName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            education_level: formData.educationLevel,
            subject_group: formData.subjectGroup,
            school_name: formData.schoolName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || "Đăng ký thất bại");
      } else {
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setSuccessMsg("Đăng ký thành công! Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản.");
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl">
            SK
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
            Đăng ký tài khoản SKKN AI
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Nhận ngay <span className="font-semibold text-blue-600">3 ngày dùng thử miễn phí</span> toàn bộ tính năng trợ lý
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200" role="alert">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Họ và tên giáo viên
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Địa chỉ Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="giaovien@school.edu.vn"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="educationLevel" className="block text-sm font-medium text-slate-700">
                Cấp học
              </label>
              <select
                id="educationLevel"
                value={formData.educationLevel}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
              >
                <option value="PRE_SCHOOL">Mầm non</option>
                <option value="PRIMARY">Tiểu học</option>
                <option value="SECONDARY">THCS</option>
                <option value="HIGH_SCHOOL">THPT</option>
                <option value="VOCATIONAL">GDTX / Nghề</option>
              </select>
            </div>

            <div>
              <label htmlFor="subjectGroup" className="block text-sm font-medium text-slate-700">
                Môn / Nhóm chuyên môn
              </label>
              <select
                id="subjectGroup"
                value={formData.subjectGroup}
                onChange={(e) => setFormData({ ...formData, subjectGroup: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
              >
                <option value="MATH">Toán học</option>
                <option value="LITERATURE">Ngữ văn</option>
                <option value="FOREIGN_LANGUAGES">Ngoại ngữ</option>
                <option value="NATURAL_SCIENCES">Khoa học tự nhiên</option>
                <option value="SOCIAL_SCIENCES">Khoa học xã hội</option>
                <option value="PRIMARY_GENERAL">Tiểu học (Tổng hợp)</option>
                <option value="PRE_SCHOOL">Mầm non</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700">
              Trường học / Đơn vị công tác (tùy chọn)
            </label>
            <input
              id="schoolName"
              type="text"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Trường THCS Chu Văn An"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition"
            >
              {loading ? "Đang khởi tạo tài khoản..." : "Đăng ký & Bắt đầu Dùng thử"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
