"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// ---- Banner cảnh báo khi Supabase chưa cấu hình ----
function SupabaseSetupBanner() {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-amber-900 text-base mb-1">
            Chưa cấu hình Supabase Database
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            Ứng dụng cần kết nối với Supabase để lưu trữ tài khoản giáo viên và dữ liệu SKKN. Thực hiện 3 bước sau để kích hoạt:
          </p>

          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3 rounded-lg bg-white border border-amber-200 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Tạo tài khoản Supabase miễn phí</div>
                <a
                  href="https://supabase.com/dashboard/sign-up"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  Truy cập supabase.com <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white border border-amber-200 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Tạo New Project → chọn Region: Singapore</div>
                <div className="text-xs text-slate-600 mt-0.5">Sau đó vào <strong>Settings → API</strong> để lấy URL và Anon Key</div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white border border-amber-200 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Cập nhật file <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code></div>
                <div className="mt-1 rounded bg-slate-900 px-3 py-2 text-xs font-mono text-green-400 leading-relaxed">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://abc.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=eyJ...</div>
                </div>
                <div className="text-xs text-slate-500 mt-1">Sau đó khởi động lại: <code className="bg-slate-100 px-1 rounded">npm run dev</code></div>
              </div>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
          >
            <Sparkles className="h-4 w-4" />
            Tạo Supabase Project miễn phí ngay
            <ExternalLink className="h-4 w-4" />
          </a>

          <p className="mt-3 text-center text-xs text-amber-700">
            Supabase Free Tier: 500MB Database, 1GB Storage, 50,000 MAU — đủ dùng cho đến khi deploy production.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Form đăng ký thực sự ----
function RegisterForm() {
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
      const { createClient } = await import("@/lib/supabase/client");
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
      const msg = (err as Error).message;
      if (msg === "SUPABASE_NOT_CONFIGURED") {
        setErrorMsg("Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local.");
      } else {
        setErrorMsg(msg || "Đã xảy ra lỗi kết nối");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Đăng ký tài khoản SKKN AI
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Nhận ngay <span className="font-semibold text-blue-600">3 ngày dùng thử miễn phí</span> toàn bộ tính năng trợ lý
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start gap-2" role="alert">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200 flex items-start gap-2" role="alert">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="giaovien@school.edu.vn"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Mật khẩu <span className="text-slate-400 font-normal">(tối thiểu 6 ký tự)</span>
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="••••••••"
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
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
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
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
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
            Trường học / Đơn vị công tác <span className="text-slate-400 font-normal">(tùy chọn)</span>
          </label>
          <input
            id="schoolName"
            type="text"
            value={formData.schoolName}
            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Trường THCS Chu Văn An"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang khởi tạo tài khoản...
              </>
            ) : (
              <>
                Đăng ký & Bắt đầu Dùng thử
                <ArrowRight className="h-4 w-4" />
              </>
            )}
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
  );
}

export default function RegisterPage() {
  const configured = isSupabaseConfigured;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 gap-6">
      {/* Back to home */}
      <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition self-start max-w-lg w-full">
        ← Quay về trang chủ
      </Link>

      {!configured ? <SupabaseSetupBanner /> : <RegisterForm />}
    </div>
  );
}