"use client";

import { useState, useEffect } from "react";

export default function AdminSystemPage() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.message);
      else setHealth(json.data.health || null);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Đang kiểm tra sức khỏe hệ thống...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Sức Khỏe Hệ Thống & Trạng Thái Dịch Vụ</h1>
          <p className="text-xs text-slate-400 mt-1">
            Giám sát thời gian thực cơ sở dữ liệu, dịch vụ xác thực, nhà cung cấp AI và tỷ lệ lỗi.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchHealth}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          Kiểm tra lại 🔄
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Hạ Tầng Cốt Lõi</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Ứng dụng Web:</span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold">
                  {health.appStatus}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Cơ sở dữ liệu (PostgreSQL):</span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold">
                  {health.databaseStatus}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Xác thực Supabase Auth:</span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold">
                  {health.supabaseAuth}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Dịch vụ Lưu trữ File (Storage):</span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold">
                  {health.storageService}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nhà Cung Cấp AI</h3>
            <div className="space-y-2 text-xs">
              {health.aiProviders?.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-800 last:border-0">
                  <span className="text-slate-300 font-semibold">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{p.latencyMs}ms</span>
                    <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold text-[10px]">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
