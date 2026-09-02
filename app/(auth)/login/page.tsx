"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ExternalLink, Sparkles, Eye, EyeOff } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// ---- Banner cảnh báo ----
function SupabaseSetupBanner() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-amber-900 text-base mb-1">
            Supabase chưa được cấu hình
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            Để đăng nhập, hệ thống cần kết nối với Supabase Database. Thực hiện các bước sau:
          </p>
          <div className="space-y-2 mb-4 text-sm text-amber-900">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">1</span>
              <span>Tạo tài khoản miễn phí tại <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">2</span>
              <span>Tạo Project mới → Settings → API → lấy URL & Keys</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">3</span>
              <span>Điền vào <code className="bg-white border px-1 rounded text-xs">.env.local</code> rồi restart <code className="bg-white border px-1 rounded text-xs">npm run dev</code></span>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
          >
            Tạo Supabase Project miễn phí
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="mt-4 text-center text-xs text-amber-700">
            Đã có keys?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:underline">
              Quay lại Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Form đăng nhập thực sự ----
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMsg(
          error.message.includes("Invalid login credentials")
            ? "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại."
            : error.message || "Đăng nhập thất bại."
        );
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "SUPABASE_NOT_CONFIGURED") {
        setErrorMsg("Supabase chưa được cấu hình. Kiểm tra file .env.local.");
      } else {
        setErrorMsg(msg || "Đã xảy ra lỗi kết nối");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Đăng nhập SKKN AI
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Đăng ký nhận 3 ngày dùng thử miễn phí
          </Link>
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start gap-2" role="alert">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Địa chỉ Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="thayco@edu.vn"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang xác thực...
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const configured = isSupabaseConfigured;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 gap-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition self-start max-w-md w-full">
        ← Quay về trang chủ
      </Link>

      {!configured ? (
        <SupabaseSetupBanner />
      ) : (
        <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      )}
    </div>
  );
}