"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectRecord, ProjectFactRecord } from "@/types/project";

export default function ProjectSettingsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [formData, setFormData] = useState({
    workingTitle: "",
    educationLevel: "",
    subjectGroup: "",
    gradeLevel: "",
    schoolYear: "",
    schoolName: "",
    problemStatement: "",
    targetGroup: "",
    initialGoal: "",
  });

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}`);
      if (res.ok) {
        const json = await res.json();
        const p: ProjectRecord = json.data.project;
        const facts: ProjectFactRecord[] = json.data.facts || [];

        const getFact = (key: string) => {
          const f = facts.find((r) => r.key === key);
          if (!f || !f.valueJson) return "";
          if (typeof f.valueJson === "object" && "text" in (f.valueJson as Record<string, unknown>)) {
            return String((f.valueJson as Record<string, unknown>).text);
          }
          return String(f.valueJson);
        };

        setProject(p);
        setFormData({
          workingTitle: p.workingTitle || p.title || "",
          educationLevel: p.educationLevel || "",
          subjectGroup: p.subjectGroup || "",
          gradeLevel: p.gradeLevel || "",
          schoolYear: p.schoolYear || "",
          schoolName: p.schoolName || "",
          problemStatement: getFact("problem_statement"),
          targetGroup: getFact("target_group"),
          initialGoal: getFact("initial_goal"),
        });
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/projects/${params.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Lưu thông tin dự án thành công!");
      } else {
        setErrorMsg(data.message || "Lưu thất bại.");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!project) return;
    const isArchived = project.status === "ARCHIVED";
    const action = isArchived ? "RESTORE" : "ARCHIVE";

    if (!confirm(isArchived ? "Khôi phục dự án về danh sách hoạt động?" : "Lưu trữ dự án này?")) return;

    try {
      const res = await fetch(`/api/projects/${params.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchProject();
        setMessage(isArchived ? "Đã khôi phục dự án." : "Đã lưu trữ dự án.");
      }
    } catch {
      // fallback
    }
  };

  const handleDelete = async () => {
    if (!confirm("Thầy/Cô có chắc chắn muốn xóa dự án này? Dữ liệu sẽ được chuyển vào thùng rác.")) return;
    try {
      const res = await fetch(`/api/projects/${params.projectId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/projects");
      }
    } catch {
      // fallback
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải cài đặt dự án...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cài đặt & Chỉnh sửa dự án</h1>
            <p className="text-xs text-slate-500">Cập nhật thông tin chuyên môn và quản lý trạng thái dự án</p>
          </div>
          <Link
            href={`/projects/${params.projectId}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            ← Về Không gian dự án
          </Link>
        </div>

        {message && (
          <div className="rounded-lg bg-green-50 p-4 text-xs text-green-700 border border-green-200" role="alert">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-4 text-xs text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="workingTitle" className="block text-xs font-semibold text-slate-700">
              Tên dự án (Tạm thời)
            </label>
            <input
              id="workingTitle"
              type="text"
              value={formData.workingTitle}
              onChange={(e) => setFormData({ ...formData, workingTitle: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="educationLevel" className="block text-xs font-semibold text-slate-700">
                Cấp học
              </label>
              <input
                id="educationLevel"
                type="text"
                value={formData.educationLevel}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="subjectGroup" className="block text-xs font-semibold text-slate-700">
                Môn / Chuyên môn
              </label>
              <input
                id="subjectGroup"
                type="text"
                value={formData.subjectGroup}
                onChange={(e) => setFormData({ ...formData, subjectGroup: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="gradeLevel" className="block text-xs font-semibold text-slate-700">
                Khối / Lớp
              </label>
              <input
                id="gradeLevel"
                type="text"
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="schoolYear" className="block text-xs font-semibold text-slate-700">
                Năm học
              </label>
              <input
                id="schoolYear"
                type="text"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="schoolName" className="block text-xs font-semibold text-slate-700">
                Trường / Đơn vị
              </label>
              <input
                id="schoolName"
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="problemStatement" className="block text-xs font-semibold text-slate-700">
              Vấn đề thực tế cần giải quyết
            </label>
            <textarea
              id="problemStatement"
              rows={3}
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="targetGroup" className="block text-xs font-semibold text-slate-700">
              Đối tượng áp dụng
            </label>
            <input
              id="targetGroup"
              type="text"
              value={formData.targetGroup}
              onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="initialGoal" className="block text-xs font-semibold text-slate-700">
              Mục tiêu ban đầu
            </label>
            <textarea
              id="initialGoal"
              rows={2}
              value={formData.initialGoal}
              onChange={(e) => setFormData({ ...formData, initialGoal: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>

        {/* Danger & Archive Zone */}
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-red-700">Quản lý trạng thái dự án</h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                {project?.status === "ARCHIVED" ? "Khôi phục dự án" : "Lưu trữ dự án"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Lưu trữ giúp ẩn dự án khỏi danh sách chính mà không làm mất dữ liệu.
              </p>
            </div>
            <button
              type="button"
              onClick={handleArchiveToggle}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {project?.status === "ARCHIVED" ? "Khôi phục" : "Lưu trữ dự án"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-red-600">Xóa dự án</h3>
              <p className="text-[11px] text-slate-500">
                Chuyển dự án vào thùng rác.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
            >
              Xóa dự án
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
