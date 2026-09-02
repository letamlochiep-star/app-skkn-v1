"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AdminDashboardMetrics } from "@/types/admin";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/metrics");
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi tải dữ liệu quản trị");
      } else {
        setMetrics(json.data);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải trung tâm chỉ số quản trị...</div>;
  }

  const cards = [
    { label: "Tổng người dùng", value: metrics?.totalUsers || 0, icon: "👥", color: "text-blue-400" },
    { label: "Đang dùng thử (Trial)", value: metrics?.activeTrials || 0, icon: "⏳", color: "text-amber-400" },
    { label: "Thuê bao trả phí", value: metrics?.activeSubscriptions || 0, icon: "⭐", color: "text-emerald-400" },
    { label: "Giấy phép (Active)", value: metrics?.activeLicenses || 0, icon: "🔑", color: "text-indigo-400" },
    { label: "Thiết bị kết nối", value: metrics?.activeDevices || 0, icon: "💻", color: "text-purple-400" },
    { label: "Đề tài khởi tạo", value: metrics?.totalProjects || 0, icon: "📚", color: "text-cyan-400" },
    { label: "Tệp đã xuất bản", value: metrics?.totalExports || 0, icon: "📦", color: "text-teal-400" },
    { label: "Chi phí AI ước tính", value: `$${metrics?.totalAICostUsd.toFixed(2) || "0.00"}`, icon: "🤖", color: "text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tổng quan Vận hành Hệ thống</h1>
          <p className="text-xs text-slate-400 mt-1">
            Trung tâm giám sát thời gian thực người dùng, bản quyền, thiết bị và chi phí tài nguyên AI.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          Làm mới chỉ số 🔄
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span className={`text-xl font-bold font-mono ${c.color}`}>{c.value}</span>
            </div>
            <p className="text-xs font-semibold text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Navigation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thao tác Nhanh Quản trị viên</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/licenses"
            className="rounded-xl border border-slate-800 bg-slate-800/60 p-4 hover:border-indigo-500/50 hover:bg-slate-800 transition block space-y-1"
          >
            <span className="text-xs font-bold text-indigo-400 block">🔑 Cấp phát Mã License</span>
            <p className="text-[11px] text-slate-400">Tạo mã bản quyền theo lô cho trường học hoặc cá nhân.</p>
          </Link>

          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-800 bg-slate-800/60 p-4 hover:border-emerald-500/50 hover:bg-slate-800 transition block space-y-1"
          >
            <span className="text-xs font-bold text-emerald-400 block">👥 Quản lý Người dùng & Trial</span>
            <p className="text-[11px] text-slate-400">Gia hạn thời gian dùng thử hoặc nâng cấp gói trực tiếp.</p>
          </Link>

          <Link
            href="/admin/ai-cost"
            className="rounded-xl border border-slate-800 bg-slate-800/60 p-4 hover:border-rose-500/50 hover:bg-slate-800 transition block space-y-1"
          >
            <span className="text-xs font-bold text-rose-400 block">🤖 Giám sát Chi phí AI</span>
            <p className="text-[11px] text-slate-400">Xem thống kê tokens theo từng model OpenAI / Gemini / Anthropic.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
