"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMsg(error.message || "Gửi yêu cầu thất bại");
      } else {
        setMessage("Đã gửi liên kết khôi phục mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl">
            SK
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
            Khôi phục mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Nhập email đăng ký để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}

        {message && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200" role="alert">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleResetRequest}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Địa chỉ Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="giaovien@edu.vn"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition"
            >
              {loading ? "Đang gửi..." : "Gửi liên kết khôi phục"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500">
          Quay lại{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
