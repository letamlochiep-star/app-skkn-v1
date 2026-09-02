"use client";

import { useState, useEffect } from "react";

export default function AdminPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.message);
      else setPlans(json.data.plans || []);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Đang tải gói dịch vụ...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Quản lý Gói Dịch Vụ & Entitlements</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cấu hình giới hạn dự án, quota AI và ma trận tính năng cho từng gói cước.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 font-mono">{p.code}</span>
              <span className="rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                {p.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Thời hạn: {p.durationDays} ngày</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Giới hạn đề tài:</span>
                <strong className="font-mono text-white">{p.projectLimit} dự án</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lượt AI:</span>
                <strong className="font-mono text-white">{p.aiRequestLimit} requests</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thiết bị tối đa:</span>
                <strong className="font-mono text-white">{p.deviceLimit} thiết bị</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Tính năng kích hoạt:</span>
              <div className="flex flex-wrap gap-1">
                {p.features.map((f: string, i: number) => (
                  <span key={i} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
