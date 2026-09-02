"use client";

import { useState, useEffect } from "react";
import type { AICostBreakdown } from "@/types/admin";

export default function AdminAICostPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AICostBreakdown[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/ai-analytics");
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi tải thống kê AI");
      } else {
        setAnalytics(json.data.analytics || []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const totalCostUsd = analytics.reduce((acc, a) => acc + a.estimatedCostUsd, 0);
  const totalTokens = analytics.reduce((acc, a) => acc + a.totalInputTokens + a.totalOutputTokens, 0);
  const totalRequests = analytics.reduce((acc, a) => acc + a.requestCount, 0);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải phân tích chi phí AI...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Phân Tích Chi Phí & Tài Nguyên AI</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi chi tiết số lượng request, tokens và chi phí ước tính theo từng Provider/Model.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">Tổng Chi Phí Ước Tính</span>
          <p className="text-2xl font-bold text-rose-400 font-mono">${totalCostUsd.toFixed(2)}</p>
          <span className="text-[11px] text-slate-500">~ {(totalCostUsd * 25400).toLocaleString("vi-VN")} VNĐ</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">Tổng Tokens Tiêu Thụ</span>
          <p className="text-2xl font-bold text-indigo-400 font-mono">{(totalTokens / 1000).toFixed(1)}k</p>
          <span className="text-[11px] text-slate-500">{totalTokens.toLocaleString()} tokens</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">Tổng Số Lượt Gọi (Requests)</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{totalRequests}</p>
          <span className="text-[11px] text-slate-500">Phân bổ đa nhà cung cấp</span>
        </div>
      </div>

      {/* Analytics Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Chi tiết theo Nhà cung cấp & Mô hình
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr className="text-left font-bold text-slate-400">
                <th className="py-3 px-4">Nhà cung cấp (Provider)</th>
                <th className="py-3 px-4">Mô hình (Model)</th>
                <th className="py-3 px-4 text-right">Số lượt gọi</th>
                <th className="py-3 px-4 text-right">Input Tokens</th>
                <th className="py-3 px-4 text-right">Output Tokens</th>
                <th className="py-3 px-4 text-right">Chi phí ước tính ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {analytics.map((a, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white font-sans">{a.provider}</td>
                  <td className="py-3 px-4 text-indigo-300">{a.model}</td>
                  <td className="py-3 px-4 text-right">{a.requestCount}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{a.totalInputTokens.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{a.totalOutputTokens.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-300">${a.estimatedCostUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
