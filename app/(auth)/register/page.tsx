"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, Key, CheckCircle2, ArrowRight, ExternalLink,
  ShieldCheck, AlertTriangle
} from "lucide-react";
import { signInWithGoogle, saveGeminiKeys, getStoredGeminiKeys } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [educationLevel, setEducationLevel] = useState("SECONDARY");
  const [subjectGroup, setSubjectGroup] = useState("MATH");
  const [schoolName, setSchoolName] = useState("");
  const [geminiKeysText, setGeminiKeysText] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const existing = getStoredGeminiKeys();
    if (existing.length > 0) setGeminiKeysText(existing.join("\n"));
  }, []);

  const parseKeys = (text: string) =>
    text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("AIza") && l.length >= 35);

  const handleRegister = async () => {
    setLoading(true);
    setStatusMsg(null);

    const keys = parseKeys(geminiKeysText);
    if (keys.length > 0) saveGeminiKeys(keys);

    try {
      const res = await fetch("/api/auth/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || "giaovien.moi@skkn.edu.vn",
          fullName: fullName || "Thầy/Cô Giáo",
          educationLevel,
          subjectGroup,
          schoolName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo tài khoản");
      }

      setStatusMsg({ type: "success", text: "Khởi tạo thành công! Đang chuyển đến Bảng điều khiển..." });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err) {
      setStatusMsg({ type: "error", text: (err as Error).message || "Đã xảy ra lỗi" });
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setStatusMsg(null);
    const keys = parseKeys(geminiKeysText);
    if (keys.length > 0) saveGeminiKeys(keys);

    try {
      await signInWithGoogle();
    } catch {
      await handleRegister();
    }
  };

  const validKeyCount = parseKeys(geminiKeysText).length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Đăng ký Tài khoản Giáo viên
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nhận ngay <span className="font-bold text-blue-600">3 ngày dùng thử miễn phí</span> toàn bộ tính năng trợ lý SKKN
          </p>
        </div>

        {statusMsg && (
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3.5 text-xs font-medium border ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. NÚT GOOGLE 1-CHẠM */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          ) : (
            <GoogleIcon />
          )}
          <span>{loading ? "Đang kết nối..." : "Đăng ký nhanh bằng Google"}</span>
        </button>

        {/* 2. KHUNG NHẬP NHIỀU GOOGLE GEMINI API KEY */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Google Gemini API Key (Miễn phí)
                </span>
                <span className="text-[11px] text-slate-500">
                  Nhập nhiều key (mỗi dòng 1 key) để tự động xoay vòng hạn mức
                </span>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-50 transition flex-shrink-0"
            >
              Lấy key <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <textarea
            value={geminiKeysText}
            onChange={(e) => setGeminiKeysText(e.target.value)}
            rows={3}
            placeholder={"AIzaSyA1234567890abcdefghijklmnopqrstuv\nAIzaSyB0987654321zyxwvutsrqponmlkjihgfe\n(Mỗi dòng một key — hệ thống tự động chuyển key khi hết quota)"}
            className="w-full rounded-xl border border-blue-200/80 bg-white p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none shadow-inner"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {validKeyCount > 0 ? (
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 inline" /> {validKeyCount} key hợp lệ (Xoay vòng tự động)
                </span>
              ) : (
                <span className="text-slate-400">Chưa có key? Vẫn có thể bổ sung sau</span>
              )}
            </span>
          </div>
        </div>

        {/* 3. THÔNG TIN CHUYÊN MÔN SƯ PHẠM */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Thầy Lê Tâm"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="giaovien@edu.vn"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cấp học
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="PRE_SCHOOL">Mầm non</option>
                <option value="PRIMARY">Tiểu học</option>
                <option value="SECONDARY">THCS</option>
                <option value="HIGH_SCHOOL">THPT</option>
                <option value="VOCATIONAL">GDTX / Nghề</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Môn / Nhóm chuyên môn
              </label>
              <select
                value={subjectGroup}
                onChange={(e) => setSubjectGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang khởi tạo tài khoản...</span>
              </>
            ) : (
              <>
                <span>Đăng Ký & Bắt Đầu Ngay (Miễn phí 3 ngày)</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Đã có tài khoản? Đăng nhập ngay
          </Link>
          <span>•</span>
          <Link href="/" className="hover:text-blue-600 transition">
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}