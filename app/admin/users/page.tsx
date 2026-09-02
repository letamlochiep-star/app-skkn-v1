"use client";

import { useState, useEffect } from "react";
import type { AdminUserSummary } from "@/types/admin";

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi tải danh sách người dùng");
      } else {
        setUsers(json.data.users || []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async (userId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXTEND_TRIAL", extendDays: 3 }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Gia hạn Trial thất bại");
      } else {
        setSuccessMsg(json.message);
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    }
  };

  const handleUpgradePlan = async (userId: string, planCode: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPGRADE_PLAN", planCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Nâng cấp gói thất bại");
      } else {
        setSuccessMsg(json.message);
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách người dùng...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Người Dùng & Gói Cước</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi tình trạng dùng thử, nâng cấp gói và phân quyền giáo viên.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300" role="alert">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-4 text-xs text-emerald-300" role="alert">
          {successMsg}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Danh sách tài khoản ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr className="text-left font-bold text-slate-400">
                <th className="py-3 px-4">Họ và tên / Email</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4">Gói cước</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Dự án</th>
                <th className="py-3 px-4 text-right">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{u.fullName}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{u.email}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{u.schoolName || "Chưa cập nhật"}</td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      u.planCode === "SCHOOL_ENTERPRISE"
                        ? "bg-purple-950 text-purple-300 border border-purple-800"
                        : u.planCode === "INDIVIDUAL_PRO"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}>
                      {u.planCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-200">{u.role}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">{u.projectCount}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {u.planCode === "TRIAL_3D" && (
                      <button
                        type="button"
                        onClick={() => handleExtendTrial(u.id)}
                        className="rounded bg-amber-900/60 border border-amber-700 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-800"
                      >
                        +3 Ngày Trial
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpgradePlan(u.id, "INDIVIDUAL_PRO")}
                      className="rounded bg-emerald-900/60 border border-emerald-700 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-800"
                    >
                      Lên PRO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
