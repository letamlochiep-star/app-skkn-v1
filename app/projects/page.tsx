"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  STAGE_LABELS,
  STAGE_PROGRESS_MAP,
  type ProjectRecord,
} from "@/types/project";

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("documentType", typeFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data?.items || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Thầy/Cô có muốn lưu trữ dự án này?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ARCHIVE" }),
      });
      if (res.ok) fetchProjects();
    } catch {
      // fallback
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTORE" }),
      });
      if (res.ok) fetchProjects();
    } catch {
      // fallback
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Thầy/Cô có chắc chắn muốn xóa dự án này?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) fetchProjects();
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dự án Sáng kiến & Giải pháp</h1>
            <p className="text-xs text-slate-500">Quản lý toàn bộ đề tài SKKN và Giải pháp hữu ích của bạn</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Bảng điều khiển
            </Link>
            <Link
              href="/projects/new"
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
            >
              + Tạo dự án mới
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 text-xs font-medium">
            {[
              { code: "ALL", label: "Tất cả" },
              { code: "DRAFT", label: "Đang thực hiện" },
              { code: "COMPLETED", label: "Hoàn thành" },
              { code: "ARCHIVED", label: "Đã lưu trữ" },
            ].map((t) => (
              <button
                key={t.code}
                onClick={() => setStatusFilter(t.code)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === t.code
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Type Filter & Search Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">Tất cả loại hình</option>
              <option value="SKKN">Sáng kiến kinh nghiệm</option>
              <option value="SOLUTION">Giải pháp hữu ích</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Tìm theo tên đề tài..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-blue-500"
              />
            </form>
          </div>
        </div>

        {/* Project List / Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Đang tải danh sách dự án...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 font-bold">
              📁
            </div>
            <h3 className="text-base font-bold text-slate-900">Chưa có dự án nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hãy tạo dự án đầu tiên để bắt đầu xây dựng Sáng kiến kinh nghiệm hoặc Giải pháp hữu ích.
            </p>
            <div className="pt-2">
              <Link
                href="/projects/new"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
              >
                + Tạo dự án đầu tiên
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const progress = STAGE_PROGRESS_MAP[p.workflowStage] || 10;
              const isArchived = p.status === "ARCHIVED";

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition"
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          p.documentType === "SKKN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.documentType === "SKKN" ? "SKKN" : "Giải pháp hữu ích"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.schoolYear}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mt-3 text-sm font-bold text-slate-900 line-clamp-2 min-h-[40px]">
                      {p.workingTitle || p.title || "Dự án chưa đặt tên"}
                    </h2>

                    {/* Meta info */}
                    <p className="mt-2 text-xs text-slate-500">
                      {p.subjectGroup} • {p.educationLevel} {p.gradeLevel ? `(${p.gradeLevel})` : ""}
                    </p>

                    {/* Stage & Progress */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">
                          {STAGE_LABELS[p.workflowStage] || p.workflowStage}
                        </span>
                        <span className="text-slate-900 font-bold">{progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/projects/${p.id}`}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Tiếp tục →
                    </Link>

                    <div className="flex items-center gap-2 text-xs">
                      {isArchived ? (
                        <button
                          onClick={() => handleRestore(p.id)}
                          className="text-slate-600 hover:text-blue-600"
                        >
                          Khôi phục
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(p.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          Lưu trữ
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
