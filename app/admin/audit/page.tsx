"use client";

import { useState, useEffect } from "react";
import type { AdminAuditLogRecord } from "@/types/admin";

export default function AdminAuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/audit-logs");
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi tải nhật ký");
      } else {
        setLogs(json.data.logs || []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải nhật ký vận hành...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Nhật Ký Vận Hành & Kiểm Toán Hệ Thống</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận toàn bộ thao tác cấp quyền, thay đổi cấu hình, tạo license và hoạt động quan trọng.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          Làm mới 🔄
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Lịch sử hoạt động gần nhất ({logs.length})
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Chưa có nhật ký vận hành nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-900/50">
                <tr className="text-left font-bold text-slate-400">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Loại tài nguyên</th>
                  <th className="py-3 px-4">ID Tài nguyên</th>
                  <th className="py-3 px-4">Chi tiết thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 font-sans">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-indigo-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{log.resourceType}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{log.resourceId || "-"}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.detailsJson)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
