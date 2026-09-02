"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProjectSectionRecord, ProjectSectionVersionRecord } from "@/types/writer";
import type { ProjectPrompt } from "@/types/prompt";
import type { ProjectRecord } from "@/types/project";

export default function ProjectWriterPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [prompts, setPrompts] = useState<ProjectPrompt[]>([]);
  const [sections, setSections] = useState<ProjectSectionRecord[]>([]);
  const [selectedPromptNumber, setSelectedPromptNumber] = useState<number>(1);

  // Editor state
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Versions Modal
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ProjectSectionVersionRecord[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWriterState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWriterState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/write`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải AI Writer.");
      } else {
        setProject(json.data.project);
        setPrompts(json.data.prompts || []);
        setSections(json.data.sections || []);

        const currentSec = (json.data.sections || []).find((s: any) => s.promptNumber === selectedPromptNumber);
        if (currentSec) {
          setContent(currentSec.content || "");
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (num: number) => {
    setSelectedPromptNumber(num);
    setErrorMsg(null);
    setSuccessMsg(null);
    const targetSec = sections.find((s) => s.promptNumber === num);
    setContent(targetSec?.content || "");
  };

  const handleGenerate = async (revisionMode?: string) => {
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_w_${selectedPromptNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/write/${selectedPromptNumber}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, revisionMode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tạo nội dung.");
      } else {
        setContent(json.data.content);
        setSuccessMsg(`Đã tạo nội dung cho Prompt ${selectedPromptNumber} thành công!`);
        fetchWriterState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi tạo nội dung");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/write/${selectedPromptNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi lưu chỉnh sửa");
      } else {
        setSuccessMsg(`Đã lưu nội dung Prompt ${selectedPromptNumber} thành công!`);
        fetchWriterState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/write/${selectedPromptNumber}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi phê duyệt phần này");
      } else {
        setSuccessMsg(`Đã xác nhận và phê duyệt Prompt ${selectedPromptNumber}!`);
        fetchWriterState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setApproving(false);
    }
  };

  const handleOpenVersions = async () => {
    setShowVersions(true);
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/write/${selectedPromptNumber}/versions`);
      const json = await res.json();
      if (res.ok) {
        setVersions(json.data.versions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${params.projectId}/write/${selectedPromptNumber}/versions/${versionId}/restore`,
        { method: "POST" }
      );
      const json = await res.json();
      if (res.ok) {
        setContent(json.data.content);
        setShowVersions(false);
        setSuccessMsg("Đã khôi phục phiên bản thành công!");
        fetchWriterState();
      }
    } catch {
      setErrorMsg("Khôi phục phiên bản thất bại");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang khởi tạo AI Writer Workspace...</div>;
  }

  const currentPrompt = prompts.find((p) => p.promptNumber === selectedPromptNumber);
  const currentSection = sections.find((s) => s.promptNumber === selectedPromptNumber);
  const completedCount = sections.filter((s) => s.content.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                Bước 3 / 6: AI Writer
              </span>
              <span className="text-xs text-slate-500">
                Đã hoàn thành {completedCount} / 18 phần
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
              Không gian Soạn thảo AI Writer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.projectId}/prompts`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về Bộ 18 Câu lệnh
            </Link>
            <Link
              href={`/projects/${params.projectId}/document`}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition"
            >
              Ghép Bản thảo & Xem trước →
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl bg-green-50 p-4 text-xs text-green-700 border border-green-200" role="alert">
            {successMsg}
          </div>
        )}

        {/* 3-COLUMN WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR: 18 PROMPT NAVIGATION (3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                18 Câu lệnh Soạn thảo
              </h3>
              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {prompts.map((p) => {
                  const sec = sections.find((s) => s.promptNumber === p.promptNumber);
                  const isSelected = selectedPromptNumber === p.promptNumber;
                  const hasContent = sec && sec.content.trim().length > 0;
                  const isApproved = sec?.status === "APPROVED";

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPrompt(p.promptNumber)}
                      className={`w-full text-left rounded-xl p-2.5 transition flex items-start justify-between gap-2 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold block opacity-80">
                          Prompt {p.promptNumber}
                        </span>
                        <p className="text-xs font-semibold line-clamp-1">{p.title}</p>
                      </div>

                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${
                          isApproved
                            ? isSelected
                              ? "bg-emerald-400 text-emerald-950"
                              : "bg-emerald-100 text-emerald-800"
                            : hasContent
                            ? isSelected
                              ? "bg-blue-400 text-blue-950"
                              : "bg-blue-100 text-blue-800"
                            : isSelected
                            ? "bg-slate-500 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isApproved ? "Đã duyệt" : hasContent ? "Đã viết" : "Chưa viết"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER: SECTION EDITOR & ACTIONS (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              {/* Header of selected prompt */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                      Prompt {selectedPromptNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{currentPrompt?.title}</h3>
                  </div>
                  {currentSection?.status && (
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Trạng thái: <strong>{currentSection.status}</strong> | Phiên bản: v{currentSection.version}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenVersions}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Lịch sử (v{currentSection?.version || 1})
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => handleGenerate()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  {generating ? "Đang tạo AI..." : content.trim().length > 0 ? "Tạo lại AI" : "Tạo nội dung AI"}
                </button>
                {content.trim().length > 0 && (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveEdit}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      {saving ? "Đang lưu..." : "Lưu chỉnh sửa"}
                    </button>
                    <button
                      type="button"
                      disabled={approving || currentSection?.status === "APPROVED"}
                      onClick={handleApprove}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                    >
                      {currentSection?.status === "APPROVED" ? "✓ Đã duyệt phần này" : "Xác nhận phần này"}
                    </button>
                  </>
                )}
              </div>

              {/* Editor textarea */}
              <div>
                <label className="text-[11px] font-bold text-slate-600">Nội dung soạn thảo:</label>
                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Chưa có nội dung cho phần này. Bấm 'Tạo nội dung AI' hoặc nhập nội dung thủ công..."
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-4 text-xs font-serif leading-relaxed text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Số từ: {content.trim().split(/\s+/).filter(Boolean).length} từ</span>
                <span>Tự động lưu lịch sử khi chỉnh sửa</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: CONTEXT & PLACEHOLDERS PANEL (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dữ liệu & Placeholder
              </h3>

              {/* Prompt Purpose */}
              <div>
                <span className="text-[11px] font-bold text-slate-700">Mục đích yêu cầu:</span>
                <p className="text-xs text-slate-600 mt-0.5">{currentPrompt?.purpose}</p>
              </div>

              {/* Missing facts in this prompt */}
              {currentPrompt?.missingDataKeys && currentPrompt.missingDataKeys.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                  <span className="text-[10px] font-bold text-amber-900 uppercase">
                    Dữ liệu còn thiếu trong phần này:
                  </span>
                  <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                    {currentPrompt.missingDataKeys.map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/projects/${params.projectId}/data`}
                    className="block text-[11px] font-bold text-amber-800 hover:underline pt-1"
                  >
                    Bổ sung dữ liệu thực tế →
                  </Link>
                </div>
              )}

              {/* Standard Placeholder Reminders */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1 text-xs text-slate-600">
                <span className="font-bold text-slate-800 text-[11px]">Placeholder chuẩn:</span>
                <p className="font-mono text-[10px] text-slate-700">[CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN]</p>
                <p className="font-mono text-[10px] text-slate-700">[CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN]</p>
                <p className="font-mono text-[10px] text-slate-700">[NGUỒN CẦN XÁC MINH]</p>
              </div>
            </div>
          </div>
        </div>

        {/* VERSIONS MODAL */}
        {showVersions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Lịch sử phiên bản Prompt {selectedPromptNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVersions(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {loadingVersions ? (
                <div className="p-4 text-center text-xs text-slate-500">Đang tải lịch sử...</div>
              ) : versions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">Chưa có phiên bản cũ.</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {versions.map((v) => (
                    <div key={v.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          Phiên bản v{v.version} ({v.source})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(v.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-3 font-serif whitespace-pre-wrap">
                        {v.content}
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(v.id)}
                          className="rounded bg-slate-800 px-3 py-1 text-[11px] font-semibold text-white hover:bg-slate-700 transition"
                        >
                          Khôi phục phiên bản này
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
