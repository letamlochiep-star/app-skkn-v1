"use client";

import { useState, useEffect } from "react";
import type { AdminLicenseSummary, AdminDeviceSummary } from "@/types/admin";

export default function AdminLicensesPage() {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<AdminLicenseSummary[]>([]);
  const [devices, setDevices] = useState<AdminDeviceSummary[]>([]);

  // Generator form state
  const [planCode, setPlanCode] = useState("INDIVIDUAL_PRO");
  const [count, setCount] = useState(1);
  const [maxDevices, setMaxDevices] = useState(2);
  const [generating, setGenerating] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [resLic, resDev] = await Promise.all([
        fetch("/api/admin/licenses"),
        fetch("/api/admin/devices"),
      ]);
      const jsonLic = await resLic.json();
      const jsonDev = await resDev.json();

      if (resLic.ok) setLicenses(jsonLic.data.licenses || []);
      if (resDev.ok) setDevices(jsonDev.data.devices || []);
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, count, maxDevices }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Tạo giấy phép thất bại");
      } else {
        setSuccessMsg(`Đã tạo thành công ${json.count} mã giấy phép mới!`);
        fetchData();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeLicense = async (key: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/licenses/${key}/revoke`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Thu hồi thất bại");
      } else {
        setSuccessMsg(json.message);
        fetchData();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    }
  };

  const handleDeactivateDevice = async (deviceId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/devices/${deviceId}/deactivate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Hủy thiết bị thất bại");
      } else {
        setSuccessMsg(json.message);
        fetchData();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    }
  };

  if (loading && licenses.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải trung tâm giấy phép và thiết bị...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản trị Giấy Phép & Thiết Bị</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cấp phát mã kích hoạt theo lô, kiểm soát số lượng thiết bị và thu hồi khi cần thiết.
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

      {/* License Generator Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cấp phát Mã License Theo Lô</h3>
        <form onSubmit={handleGenerateLicenses} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Gói cước</label>
            <select
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2 text-xs text-white"
            >
              <option value="INDIVIDUAL_PRO">INDIVIDUAL_PRO (Cá nhân)</option>
              <option value="SCHOOL_ENTERPRISE">SCHOOL_ENTERPRISE (Trường học)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Số lượng mã</label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Thiết bị tối đa/mã</label>
            <input
              type="number"
              min={1}
              max={10}
              value={maxDevices}
              onChange={(e) => setMaxDevices(parseInt(e.target.value, 10))}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {generating ? "Đang tạo..." : "Tạo mã bản quyền +"}
          </button>
        </form>
      </div>

      {/* Licenses Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Danh sách Giấy phép ({licenses.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr className="text-left font-bold text-slate-400">
                <th className="py-3 px-4">Mã License</th>
                <th className="py-3 px-4">Gói</th>
                <th className="py-3 px-4">Thiết bị (Đang dùng / Tối đa)</th>
                <th className="py-3 px-4">Người sở hữu</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {licenses.map((lic) => (
                <tr key={lic.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">{lic.licenseKey}</td>
                  <td className="py-3 px-4">{lic.planCode}</td>
                  <td className="py-3 px-4 font-mono">{lic.activeDevices} / {lic.maxDevices}</td>
                  <td className="py-3 px-4 text-slate-400">{lic.assignedUserEmail || "Chưa gán"}</td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      lic.status === "ACTIVE" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
                    }`}>
                      {lic.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {lic.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => handleRevokeLicense(lic.licenseKey)}
                        className="rounded bg-red-900/60 border border-red-700 px-2.5 py-1 text-[11px] font-bold text-red-200 hover:bg-red-800"
                      >
                        Thu hồi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connected Devices Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Thiết Bị Đang Kích Hoạt ({devices.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr className="text-left font-bold text-slate-400">
                <th className="py-3 px-4">Tên thiết bị</th>
                <th className="py-3 px-4">Mã License</th>
                <th className="py-3 px-4">IP / User Agent</th>
                <th className="py-3 px-4">Ngày kích hoạt</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {devices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{dev.deviceName}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{dev.licenseKey}</td>
                  <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">{dev.ipAddress}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(dev.activatedAt).toLocaleDateString("vi-VN")}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeactivateDevice(dev.id)}
                      className="rounded bg-rose-950 border border-rose-800 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-900"
                    >
                      Hủy kích hoạt
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
