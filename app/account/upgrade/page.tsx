"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function UpgradeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get("plan") || "PERSONAL_MONTHLY";

  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/upgrade-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedPlanCode: selectedPlan,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Gửi yêu cầu thất bại.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/account");
        }, 2500);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Đăng ký Nâng cấp Gói Dịch vụ
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Chọn gói phù hợp để mở khóa toàn bộ tính năng và gia hạn thời gian sử dụng
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-xs text-red-700 border border-red-200" role="alert">
          {errorMsg}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-xs text-green-700 border border-green-200" role="alert">
          Yêu cầu nâng cấp của Thầy/Cô đã được ghi nhận thành công! Đang chuyển hướng...
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Lựa chọn gói dịch vụ</label>

          <div className="grid grid-cols-1 gap-3">
            {[
              { code: "PERSONAL_MONTHLY", name: "Gói 1 Tháng (199.000 đ)", desc: "5 Đề tài, 300 AI Requests, Xuất Word/PDF" },
              { code: "PERSONAL_6_MONTHS", name: "Gói 6 Tháng (549.000 đ)", desc: "15 Đề tài, 1.500 AI Requests, Xuất Slide PPTX" },
              { code: "PERSONAL_YEARLY", name: "Gói 1 Năm (990.000 đ)", desc: "30 Đề tài, 3.000 AI Requests, Trọn gói bảo vệ BGK" },
            ].map((p) => (
              <label
                key={p.code}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  selectedPlan === p.code
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="plan"
                    value={p.code}
                    checked={selectedPlan === p.code}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">{p.name}</span>
                    <span className="block text-xs text-slate-500">{p.desc}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="note" className="block text-xs font-semibold text-slate-700">
            Ghi chú / Yêu cầu xuất hóa đơn (tùy chọn)
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ví dụ: Cần kích hoạt cho tổ chuyên môn Toán..."
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href="/plans"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Quay lại bảng giá
          </Link>
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition"
          >
            {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu nâng cấp"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-xs text-slate-500">Đang tải biểu mẫu nâng cấp...</div>}>
        <UpgradeForm />
      </Suspense>
    </div>
  );
}
