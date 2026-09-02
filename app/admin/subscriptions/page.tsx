"use client";

import { useState, useEffect } from "react";

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.message);
      else setSubscriptions(json.data.subscriptions || []);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Đang tải thuê bao...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Quản lý Thuê Bao (Subscriptions)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi chu kỳ gia hạn, ngày hết hạn và lượng sử dụng quota của từng tài khoản.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr className="text-left font-bold text-slate-400">
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Gói dịch vụ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày bắt đầu</th>
                <th className="py-3 px-4">Ngày hết hạn</th>
                <th className="py-3 px-4">Đã dùng AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-sans font-bold text-white">{s.userEmail}</td>
                  <td className="py-3 px-4 text-indigo-300">{s.planCode}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(s.startedAt).toLocaleDateString("vi-VN")}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(s.expiresAt).toLocaleDateString("vi-VN")}</td>
                  <td className="py-3 px-4 text-slate-300">{s.aiRequestsUsed} / {s.aiRequestsLimit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
