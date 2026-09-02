"use client";

import { useState, useEffect } from "react";

export default function AdminPromptsPage() {
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts");
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.message);
      else setPrompts(json.data.prompts || []);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Đang tải cấu hình Prompts...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Quản lý Phiên Bản Prompts & Quy trình AI</h1>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi các bộ prompt hệ thống, cấu hình tham số và bảo vệ các nguyên tắc sư phạm cốt lõi.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 text-[10px] font-mono font-bold">
                {p.key}
              </span>
              <span className="rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                v{p.version} • {p.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Phân loại tác vụ: {p.taskType}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-500">
              <span>Cập nhật: {new Date(p.updatedAt).toLocaleDateString("vi-VN")}</span>
              <span className="text-emerald-400 font-semibold">✓ Guardrails Khóa Bất Biến</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
