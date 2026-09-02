"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProjectPromptSet, ProjectPrompt } from "@/types/prompt";
import type { ProjectRecord } from "@/types/project";

export default function ProjectPromptsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [promptSet, setPromptSet] = useState<ProjectPromptSet | null>(null);
  const [isStructureLocked, setIsStructureLocked] = useState(false);

  // Generation & saving state
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Edit Prompt Modal
  const [editingPrompt, setEditingPrompt] = useState<ProjectPrompt | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 2 Completion
  const [confirmed, setConfirmed] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchPromptState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPromptState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/prompts`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải bộ câu lệnh.");
      } else {
        setProject(json.data.project);
        setPromptSet(json.data.promptSet);
        setIsStructureLocked(json.data.isStructureLocked);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_pset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/prompts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tạo bộ câu lệnh.");
      } else {
        setPromptSet(json.data);
        setSuccessMsg("Đã tạo bộ đúng 18 câu lệnh thành công!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi tạo câu lệnh");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopySingle = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!promptSet?.prompts) return;
    const allText = promptSet.prompts
      .map((p) => `=== PROMPT ${p.promptNumber}: ${p.title} ===\n${p.promptText}\n`)
      .join("\n");
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleOpenEdit = (prompt: ProjectPrompt) => {
    if (prompt.immutable) return;
    setEditingPrompt(prompt);
    setEditText(prompt.promptText);
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt) return;
    setSavingEdit(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/prompts/${editingPrompt.promptNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: editText }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi lưu chỉnh sửa");
      } else {
        setSuccessMsg(`Đã cập nhật Prompt ${editingPrompt.promptNumber} thành công!`);
        setEditingPrompt(null);
        fetchPromptState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCompleteStep2 = async () => {
    if (!confirmed) return;
    setCompleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/prompts/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Hoàn thành Bước 2 thất bại.");
      } else {
        setSuccessMsg("Đã hoàn thành Bước 2! Dự án sẵn sàng chuyển sang Bước 4 (Soạn thảo).");
        fetchPromptState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải bộ câu lệnh...</div>;
  }

  const isCompletedStep2 = project?.workflowStage === "WRITE" || project?.workflowStage === "REVIEW" || project?.workflowStage === "FINALIZE";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                Bước 2 / 6
              </span>
              <span className="text-xs text-slate-500">
                {project?.documentType === "SKKN" ? "Sáng kiến kinh nghiệm" : "Giải pháp hữu ích"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Bộ đúng 18 Câu lệnh Soạn thảo
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.projectId}/structure`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về Khung Cấu trúc
            </Link>
            <Link
              href={`/projects/${params.projectId}`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Không gian dự án
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

        {/* COMPLETED BANNER */}
        {isCompletedStep2 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <h2 className="text-base font-bold text-emerald-900">Bước 2 Đã Hoàn Thành Toàn Diện</h2>
            </div>
            <p className="text-xs text-emerald-800">
              Cấu trúc đã được chốt và Bộ 18 câu lệnh đã sẵn sàng. Dự án đã chuyển sang giai đoạn <strong>Bước 4: Soạn thảo</strong>.
            </p>
          </div>
        )}

        {/* GENERATION ACTION BAR */}
        {!promptSet?.prompts?.length && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xl font-bold">
              18
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Tạo Bộ đúng 18 Câu lệnh Soạn thảo</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Dựa trên khung cấu trúc đã khóa và dữ liệu thực tế, hệ thống sẽ sinh bộ đúng 18 câu lệnh cá nhân hóa theo GDPT 2018.
              </p>
            </div>
            <div>
              <button
                type="button"
                disabled={generating || !isStructureLocked}
                onClick={handleGeneratePrompts}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {generating ? "Đang tạo 18 câu lệnh..." : "Tạo Bộ 18 Câu lệnh AI"}
              </button>
            </div>
          </div>
        )}

        {/* PROMPT SET HEADER & COPY ALL */}
        {promptSet?.prompts && promptSet.prompts.length === 18 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ĐỦ 18 CÂU LỆNH CHUẨN
                </span>
                <span className="text-xs text-slate-500">Phiên bản: {promptSet.version}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Thầy/Cô có thể sao chép từng câu lệnh hoặc sao chép toàn bộ để sử dụng.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAll}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition self-end sm:self-auto"
            >
              {copiedAll ? "✓ Đã sao chép tất cả!" : "Sao chép toàn bộ 18 câu lệnh"}
            </button>
          </div>
        )}

        {/* 18 PROMPT CARDS */}
        {promptSet?.prompts && promptSet.prompts.length > 0 && (
          <div className="space-y-4">
            {promptSet.prompts.map((p) => {
              const hasPlaceholders = p.status === "READY_WITH_PLACEHOLDERS";

              return (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                        Prompt {p.promptNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                      {p.immutable && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          🔒 Bất biến
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasPlaceholders ? (
                        <span className="rounded bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 border border-amber-200">
                          Còn placeholder cần bổ sung
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          ✓ Sẵn sàng
                        </span>
                      )}
                    </div>
                  </div>

                  {p.purpose && <p className="text-xs text-slate-500">{p.purpose}</p>}

                  {/* Missing Data Alert & Link */}
                  {hasPlaceholders && (
                    <div className="rounded-lg bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center justify-between">
                      <span>Câu lệnh có chứa placeholder chờ số liệu thực từ giáo viên.</span>
                      <Link
                        href={`/projects/${params.projectId}/data`}
                        className="font-bold text-amber-800 hover:underline"
                      >
                        Bổ sung dữ liệu →
                      </Link>
                    </div>
                  )}

                  {/* Prompt Text Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {p.promptText}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!p.immutable && !isCompletedStep2 && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopySingle(p.promptText, p.promptNumber)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      {copiedIndex === p.promptNumber ? "✓ Đã sao chép" : "Sao chép câu lệnh"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2 COMPLETION CONFIRMATION */}
        {promptSet?.prompts?.length === 18 && !isCompletedStep2 && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xác nhận Hoàn thành Bước 2</h3>
            <p className="text-xs text-slate-500">
              Khi Thầy/Cô đã kiểm tra cấu trúc và bộ 18 câu lệnh, hãy đánh dấu xác nhận để hoàn tất Bước 2 và sẵn sàng cho giai đoạn soạn thảo nội dung.
            </p>

            <div className="flex items-start gap-2 pt-2">
              <input
                id="step2ConfirmCheck"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="step2ConfirmCheck" className="text-xs text-slate-700">
                Tôi đã kiểm tra khung cấu trúc và bộ 18 câu lệnh để chuẩn bị cho giai đoạn viết nội dung.
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={completing || !confirmed}
                onClick={handleCompleteStep2}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
              >
                {completing ? "Đang hoàn tất..." : "Hoàn thành Bước 2 (Chuyển sang Soạn thảo) →"}
              </button>
            </div>
          </div>
        )}

        {/* EDIT PROMPT MODAL */}
        {editingPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Chỉnh sửa Prompt {editingPrompt.promptNumber}: {editingPrompt.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPrompt(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nội dung câu lệnh:</label>
                <textarea
                  rows={8}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-3 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPrompt(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingEdit || editText.trim().length < 10}
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
