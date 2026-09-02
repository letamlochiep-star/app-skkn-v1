"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ExternalLink, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { isSupabaseConfigured, signInWithGoogle } from "@/lib/supabase/client";

// Google icon SVG
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

// ---- Banner chưa có Supabase ----
function SetupBanner() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-amber-900 mb-2">Cần cấu hình Supabase để kích hoạt đăng nhập Google</h3>
          <p className="text-sm text-amber-800 mb-4">
            Supabase cung cấp xác thực Google OAuth miễn phí và lưu trữ dữ liệu SKKN của Thầy/Cô.
          </p>
          <div className="space-y-2 text-sm text-amber-900 mb-4">
            <div className="flex gap-2"><span className="font-bold text-blue-600">1.</span> Tạo tài khoản tại <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a></div>
            <div className="flex gap-2"><span className="font-bold text-blue-600">2.</span> Tạo Project → Settings → API → lấy URL & Keys</div>
            <div className="flex gap-2"><span className="font-bold text-blue-600">3.</span> Điền vào <code className="bg-white border px-1 rounded text-xs">.env.local</code> → restart <code className="bg-white border px-1 rounded text-xs">npm run dev</code></div>
          </div>
          <a href="https://supabase.com/dashboard/sign-up" target="_blank" rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition">
            Tạo Supabase miễn phí <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ---- Form đăng nhập chính ----
function LoginForm() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    authError === "auth_callback_failed" ? "Đăng nhập Google thất bại. Vui lòng thử lại." : null
  );

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      // Google OAuth sẽ redirect, không cần xử lý thêm
    } catch (err) {
      setErrorMsg((err as Error).message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
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
            ? "Email hoặc mật khẩu không đúng."
            : error.message
        );
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
      {/* Logo & Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
          SKKN AI Platform
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Trợ lý soạn thảo Sáng kiến kinh nghiệm chuẩn GDPT 2018
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3.5 text-sm text-red-700 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* GOOGLE LOGIN (Primary) */}
      {mode === "google" && (
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="relative flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            ) : (
              <GoogleIcon />
            )}
            <span>{loading ? "Đang chuyển đến Google..." : "Đăng nhập bằng tài khoản Google"}</span>
          </button>

          {/* Info về Google OAuth + Gemini API key */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">i</div>
              <div className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">Sau khi đăng nhập bằng Google</span>, hệ thống sẽ yêu cầu Thầy/Cô nhập{" "}
                <span className="font-semibold text-blue-700">Gemini API Key miễn phí</span> để sử dụng tính năng AI soạn thảo SKKN.{" "}
                Lấy key tại{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                  className="underline font-semibold hover:text-blue-900">
                  Google AI Studio →
                </a>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-white px-3">hoặc đăng nhập bằng email</span>
            </div>
          </div>

          <button
            onClick={() => setMode("email")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <Mail className="h-4 w-4" />
            Dùng Email & Mật khẩu
          </button>
        </div>
      )}

      {/* EMAIL LOGIN (Secondary) */}
      {mode === "email" && (
        <form className="space-y-4" onSubmit={handleEmailLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="thayco@edu.vn" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition">
            {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Đang xác thực...</> : (<><Lock className="h-4 w-4" />Đăng nhập</>)}
          </button>
          <button type="button" onClick={() => setMode("google")}
            className="flex w-full items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
            ← Quay lại đăng nhập bằng Google
          </button>
        </form>
      )}

      <p className="text-center text-xs text-slate-500">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Đăng ký nhận 3 ngày dùng thử miễn phí
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-12 gap-6">
      <Link href="/" className="self-start max-w-md w-full text-sm text-slate-500 hover:text-blue-600 transition">
        ← Quay về trang chủ
      </Link>
      {!isSupabaseConfigured ? (
        <SetupBanner />
      ) : (
        <Suspense fallback={<div className="p-8 text-sm text-slate-400">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      )}
    </div>
  );
}