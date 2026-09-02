"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Key, ExternalLink, CheckCircle2, AlertTriangle, Sparkles, ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { saveGeminiKey, getStoredGeminiKey, hasGeminiKey } from "@/lib/supabase/client";

async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (res.ok) return { valid: true };
    if (res.status === 400) return { valid: false, error: "API Key không hợp lệ. Vui lòng kiểm tra lại." };
    if (res.status === 403) return { valid: false, error: "API Key bị từ chối. Kiểm tra quyền truy cập trong Google AI Studio." };
    return { valid: false, error: `Lỗi xác thực (HTTP ${res.status}).` };
  } catch {
    return { valid: false, error: "Không thể kết nối đến Google API. Kiểm tra kết nối mạng." };
  }
}

export default function SetupApiKeyPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alreadyHasKey, setAlreadyHasKey] = useState(false);

  useEffect(() => {
    const existing = getStoredGeminiKey();
    if (existing) {
      setApiKey(existing);
      setAlreadyHasKey(true);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setStatus("idle");
    setErrorMsg(null);

    const trimmedKey = apiKey.trim();

    if (!trimmedKey.startsWith("AIza")) {
      setStatus("error");
      setErrorMsg("Gemini API Key phải bắt đầu bằng 'AIza...'. Kiểm tra lại tại Google AI Studio.");
      setLoading(false);
      return;
    }

    const result = await validateGeminiKey(trimmedKey);

    if (result.valid) {
      saveGeminiKey(trimmedKey);
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      setStatus("error");
      setErrorMsg(result.error || "API Key không hợp lệ.");
    }
    setLoading(false);
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-4">
            <Key className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {alreadyHasKey ? "Cập nhật Gemini API Key" : "Thiết lập Gemini API Key"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            SKKN AI sử dụng <strong>Gemini API Key của chính Thầy/Cô</strong> để thực hiện các tính năng AI — hoàn toàn miễn phí!
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-3 text-sm text-blue-800">
              <p className="font-semibold text-blue-900">Tại sao cần Gemini API Key?</p>
              <ul className="space-y-1.5 text-xs leading-relaxed">
                <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />Gemini API của Google có gói miễn phí 15 request/phút, 1 triệu token/ngày</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />Key của Thầy/Cô chỉ lưu trên thiết bị này — SKKN AI không đọc hay lưu trữ trên server</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />Đủ để soạn thảo hoàn chỉnh 1 đề tài SKKN 18 bước</li>
              </ul>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition mt-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Lấy Gemini API Key miễn phí tại Google AI Studio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nhập Gemini API Key của bạn
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setStatus("idle"); setErrorMsg(null); }}
                  placeholder="AIzaSy..."
                  className={`block w-full rounded-lg border px-3 py-3 pr-10 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 transition ${
                    status === "success"
                      ? "border-green-400 focus:ring-green-400 bg-green-50"
                      : status === "error"
                      ? "border-red-400 focus:ring-red-400 bg-red-50"
                      : "border-slate-300 focus:ring-blue-400 focus:border-blue-400"
                  }`}
                />
                <button type="button" onClick={() => setShowKey(!showKey)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Định dạng: bắt đầu bằng <code className="bg-slate-100 px-1 rounded">AIzaSy...</code>, dài khoảng 39 ký tự
              </p>
            </div>

            {/* Status messages */}
            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">API Key hợp lệ!</div>
                  <div className="text-xs">Đang chuyển đến Dashboard...</div>
                </div>
              </div>
            )}
            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Xác thực thất bại</div>
                  <div className="text-xs mt-0.5">{errorMsg}</div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button type="submit" disabled={loading || !apiKey.trim() || status === "success"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition">
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Đang xác thực...</>
                ) : status === "success" ? (
                  <><CheckCircle2 className="h-4 w-4" />Đã lưu!</>
                ) : (
                  <>Xác thực & Lưu Key<ArrowRight className="h-4 w-4" /></>
                )}
              </button>
              <button type="button" onClick={handleSkip}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Bỏ qua
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            API Key được lưu trong bộ nhớ trình duyệt (localStorage) trên thiết bị này.{" "}
            <Link href="/dashboard/profile" className="text-blue-500 hover:underline">
              Thay đổi sau tại trang Hồ sơ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}