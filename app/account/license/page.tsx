"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOrCreateInstallationId } from "@/lib/device/installation-id";

interface LicenseData {
  id: string;
  status: string;
  maxDevices: number;
  activationCount: number;
  issuedAt: string;
  expiresAt: string | null;
}

export default function LicensePage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrCreateInstallationId();
    setInstallationId(id);
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const res = await fetch("/api/me/licenses");
      if (res.ok) {
        const json = await res.json();
        setLicenses(json.data?.licenses || []);
      }
    } catch {
      // fallback
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          installationId,
          deviceName: navigator.userAgent.includes("Windows") ? "Máy tính Windows" : "Thiết bị Giáo viên",
          browser: "Trình duyệt Web",
          os: navigator.platform || "Desktop",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.message || "Kích hoạt bản quyền thất bại.");
      } else {
        setSuccessMsg(data.message || "Kích hoạt thành công!");
        setLicenseKey("");
        fetchLicenses();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Bản quyền License</h1>
            <p className="text-xs text-slate-500">Kích hoạt mã bản quyền và quản lý thiết bị sử dụng</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Về Bảng điều khiển
          </Link>
        </div>

        {/* Tab Links */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 text-sm font-medium">
          <Link href="/account" className="px-3 py-1.5 text-slate-600 hover:text-slate-900">
            Gói dịch vụ & Quota
          </Link>
          <Link href="/account/license" className="border-b-2 border-blue-600 px-3 py-1.5 text-blue-600 font-bold">
            Bản quyền (License)
          </Link>
          <Link href="/account/devices" className="px-3 py-1.5 text-slate-600 hover:text-slate-900">
            Thiết bị đã kích hoạt
          </Link>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-4 text-xs text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg bg-green-50 p-4 text-xs text-green-700 border border-green-200" role="alert">
            {successMsg}
          </div>
        )}

        {/* Activation Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Kích hoạt Mã Bản quyền Mới</h2>
          <p className="mt-1 text-xs text-slate-500">
            Nhập mã bản quyền gồm 16 ký tự do hệ thống hoặc nhà trường cấp
          </p>

          <form className="mt-4 space-y-4" onSubmit={handleActivate}>
            <div>
              <label htmlFor="licenseKey" className="block text-xs font-semibold text-slate-700">
                Mã bản quyền (License Key)
              </label>
              <input
                id="licenseKey"
                type="text"
                required
                placeholder="SKKN-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tracking-widest text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Mã định danh thiết bị hiện tại (Installation ID):</span>
              <code className="font-mono text-slate-700 font-semibold">{installationId ? `${installationId.substring(0, 8)}...` : "Đang tạo..."}</code>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !licenseKey.trim()}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition"
              >
                {loading ? "Đang xác thực & kích hoạt..." : "Kích hoạt trên thiết bị này"}
              </button>
            </div>
          </form>
        </div>

        {/* User Licenses Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Danh sách Bản quyền của bạn</h2>
            <Link href="/account/upgrade" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
              Yêu cầu cấp mã mới →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {licenses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Bạn đang sử dụng gói trải nghiệm Trial 3 ngày. Sau khi nâng cấp gói, mã bản quyền sẽ được hiển thị và quản lý tại đây.
              </p>
            ) : (
              licenses.map((lic) => (
                <div key={lic.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">Mã #{lic.id.substring(0, 10)}</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                        {lic.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Thiết bị: <strong>{lic.activationCount} / {lic.maxDevices}</strong> • Hết hạn: {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString("vi-VN") : "Vĩnh viễn"}
                    </p>
                  </div>

                  <Link
                    href="/account/devices"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Xem thiết bị
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
