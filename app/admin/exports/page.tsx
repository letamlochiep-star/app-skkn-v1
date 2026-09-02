"use client";

import { useState, useEffect } from "react";

export default function AdminExportsPage() {
  const [loading, setLoading] = useState(true);
  const [exports, setExports] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exports");
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.message);
      else setExports(json.data.exports || []);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Đang tải tiến trình xuất bản...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Giám Sát Tiến Trình Xuất Bản (Export Monitoring)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi các lượt tạo tệp DOCX, PDF, PPTX và dung lượng lưu trữ toàn hệ thống.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr className="text-left font-bold text-slate-400">
                <th className="py-3 px-4">Tên Đề tài</th>
                <th className="py-3 px-4">Giáo viên</th>
                <th className="py-3 px-4">Định dạng</th>
                <th className="py-3 px-4">Chế độ</th>
                <th className="py-3 px-4">Dung lượng</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {exports.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-sans font-bold text-white max-w-xs truncate">{e.projectTitle}</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">{e.userEmail}</td>
                  <td className="py-3 px-4 text-indigo-300">{e.exportType}</td>
                  <td className="py-3 px-4 text-slate-400">{e.mode}</td>
                  <td className="py-3 px-4 text-slate-400">{e.sizeKb} KB</td>
                  <td className="py-3 px-4 text-slate-500 font-sans">{new Date(e.createdAt).toLocaleTimeString("vi-VN")}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {e.status}
                    </span>
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
