"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOrCreateInstallationId } from "@/lib/device/installation-id";

interface DeviceData {
  id: string;
  deviceName: string;
  browser?: string;
  os?: string;
  status: string;
  lastSeenAt: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentInstId, setCurrentInstId] = useState("");

  useEffect(() => {
    setCurrentInstId(getOrCreateInstallationId());
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/me/licenses");
      if (res.ok) {
        const json = await res.json();
        setDevices(json.data?.devices || []);
      }
    } catch {
      // fallback
    }
  };

  const handleDeactivate = async (deviceId: string) => {
    if (!confirm("Thầy/Cô có chắc chắn muốn hủy kích hoạt thiết bị này?")) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/license/deactivate-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Đã hủy kích hoạt thiết bị thành công. Slot bản quyền đã được giải phóng.");
        fetchDevices();
      } else {
        setMessage(data.message || "Hủy kích hoạt thất bại.");
      }
    } catch (err) {
      setMessage((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thiết bị đã Kích hoạt</h1>
            <p className="text-xs text-slate-500">Quản lý các máy tính và trình duyệt đang dùng bản quyền của bạn</p>
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
          <Link href="/account/license" className="px-3 py-1.5 text-slate-600 hover:text-slate-900">
            Bản quyền (License)
          </Link>
          <Link href="/account/devices" className="border-b-2 border-blue-600 px-3 py-1.5 text-blue-600 font-bold">
            Thiết bị đã kích hoạt
          </Link>
        </div>

        {message && (
          <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-700 border border-blue-200" role="alert">
            {message}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Danh sách Thiết bị ({devices.length})</h2>
            <Link
              href="/account/license"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
            >
              + Kích hoạt thiết bị mới
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {devices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Chưa có thiết bị nào được kích hoạt. Hãy sang mục{" "}
                <Link href="/account/license" className="font-semibold text-blue-600 hover:underline">
                  Bản quyền
                </Link>{" "}
                để kích hoạt máy tính hiện tại.
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{dev.deviceName}</h3>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                        {dev.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {dev.browser} • {dev.os} • Hoạt động lần cuối: {new Date(dev.lastSeenAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={() => handleDeactivate(dev.id)}
                      disabled={loading}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Hủy kích hoạt
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
