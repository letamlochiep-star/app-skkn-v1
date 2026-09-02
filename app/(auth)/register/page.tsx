"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { isSupabaseConfigured, signInWithGoogle } from "@/lib/supabase/client";

// Google icon
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function SetupBanner() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-amber-900 mb-2">Cần cấu hình Supabase để kích hoạt đăng nhập Google</h3>
          <p className="text-sm text-amber-800 mb-4">Điền thông tin Supabase vào <code className="bg-white border px-1 rounded text-xs">.env.local</code> rồi restart server.</p>
          <a href="https://supabase.com/dashboard/sign-up" target="_blank" rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition">
            Tạo Supabase miễn phí <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "email-form">("register");
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "",
    educationLevel: "SECONDARY", subjectGroup: "MATH", schoolName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleRegister = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg((err as Error).message || "Đăng ký qua Google thất bại.");
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
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
      } else if (data.session) {
        router.push("/setup-api-key");
        router.refresh();
      } else {
        setSuccessMsg("Đăng ký thành công! Kiểm tra email để kích hoạt tài khoản.");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-12 gap-6">
      <Link href="/" className="self-start max-w-md w-full text-sm text-slate-500 hover:text-blue-600 transition">← Quay về trang chủ</Link>
      <SetupBanner />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-12 gap-6">
      <Link href="/" className="self-start max-w-md w-full text-sm text-slate-500 hover:text-blue-600 transition">← Quay về trang chủ</Link>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Đăng ký SKKN AI</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Nhận ngay <span className="font-semibold text-blue-600">3 ngày dùng thử miễn phí</span> — không cần thẻ tín dụng
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 space-y-2">
          {[
            "Đăng nhập 1 click bằng tài khoản Google",
            "Dùng Gemini API Key miễn phí của bạn (từ Google AI Studio)",
            "Soạn thảo SKKN 18 bước chuẩn GDPT 2018",
            "Xuất DOCX / PDF / PPTX không giới hạn",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-3.5 text-sm text-red-700 border border-red-200 flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg bg-green-50 p-3.5 text-sm text-green-700 border border-green-200 flex gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />{successMsg}
          </div>
        )}

        {step === "register" && (
          <div className="space-y-3">
            {/* Google button - PRIMARY */}
            <button onClick={handleGoogleRegister} disabled={loading}
              className="relative flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-50">
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /> : <GoogleIcon />}
              {loading ? "Đang chuyển đến Google..." : "Tiếp tục bằng Google (Miễn phí)"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs text-slate-400">
                <span className="bg-white px-3">hoặc đăng ký bằng email</span>
              </div>
            </div>

            <button onClick={() => setStep("email-form")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Dùng Email & Mật khẩu
            </button>
          </div>
        )}

        {step === "email-form" && (
          <form className="space-y-4" onSubmit={handleEmailRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên giáo viên</label>
              <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="giaovien@school.edu.vn" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu <span className="text-slate-400">(≥6 ký tự)</span></label>
              <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cấp học</label>
                <select value={formData.educationLevel} onChange={(e) => setFormData({...formData, educationLevel: e.target.value})}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="PRE_SCHOOL">Mầm non</option>
                  <option value="PRIMARY">Tiểu học</option>
                  <option value="SECONDARY">THCS</option>
                  <option value="HIGH_SCHOOL">THPT</option>
                  <option value="VOCATIONAL">GDTX / Nghề</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                <select value={formData.subjectGroup} onChange={(e) => setFormData({...formData, subjectGroup: e.target.value})}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="MATH">Toán học</option>
                  <option value="LITERATURE">Ngữ văn</option>
                  <option value="FOREIGN_LANGUAGES">Ngoại ngữ</option>
                  <option value="NATURAL_SCIENCES">Khoa học TN</option>
                  <option value="SOCIAL_SCIENCES">Khoa học XH</option>
                  <option value="PRIMARY_GENERAL">Tiểu học (TH)</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trường <span className="text-slate-400">(tùy chọn)</span></label>
              <input type="text" value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Trường THCS Chu Văn An" />
            </div>
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition">
              {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Đang tạo tài khoản...</> : <>Đăng ký & Bắt đầu<ArrowRight className="h-4 w-4" /></>}
            </button>
            <button type="button" onClick={() => setStep("register")}
              className="flex w-full items-center justify-center text-sm text-slate-500 hover:text-blue-600 transition">
              ← Quay lại đăng ký bằng Google
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}