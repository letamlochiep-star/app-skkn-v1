"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectDocumentDraftRecord, ConsistencyCheckResult } from "@/types/writer";
import type { ProjectRecord } from "@/types/project";

export default function ProjectDocumentPreviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [draft, setDraft] = useState<ProjectDocumentDraftRecord | null>(null);
  const [consistency, setConsistency] = useState<ConsistencyCheckResult | null>(null);

  // Completion state
  const [confirmed, setConfirmed] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    assembleAndFetchDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assembleAndFetchDraft = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/write/assemble`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể ghép bản thảo.");
      } else {
        setDraft(json.data.draft);
        setConsistency(json.data.consistency);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWriterStage = async () => {
    if (!confirmed) return;
    setCompleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/write/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Hoàn thành phần viết thất bại.");
      } else {
        setSuccessMsg("Đã hoàn thành phần viết! Dự án sẵn sàng chuyển sang Bước 5 (Rà soát & Đánh giá).");
        setProject(json.data.project);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang ghép nối và chuẩn bị bản thảo toàn bài...</div>;
  }

  const isCompletedReviewStage = project?.workflowStage === "REVIEW" || project?.workflowStage === "FINALIZE";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                Bản thảo Toàn văn
              </span>
              <span className="text-xs text-slate-500">
                Phiên bản: v{draft?.version || 1}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Xem trước Bản thảo Toàn bài
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.projectId}/write`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← Quay lại AI Writer
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
        {isCompletedReviewStage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <h2 className="text-base font-bold text-emerald-900">Bản thảo đã chuyển sang Bước 5 (Rà soát)</h2>
            </div>
            <p className="text-xs text-emerald-800">
              Phần soạn thảo đã hoàn tất! Dự án đã sẵn sàng cho giai đoạn <strong>Bước 5: Rà soát & Đánh giá theo tiêu chuẩn</strong>.
            </p>
          </div>
        )}

        {/* PLACEHOLDERS & CONSISTENCY REPORT SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Placeholder Summary Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Tổng hợp Placeholder còn lại</h3>
            <div className="text-xs space-y-1 text-slate-700">
              <p>
                • Vị trí chờ dữ liệu thực: <strong>{consistency?.placeholderSummary.realDataPlaceholders || 0}</strong>
              </p>
              <p>
                • Vị trí chờ minh chứng: <strong>{consistency?.placeholderSummary.evidencePlaceholders || 0}</strong>
              </p>
              <p>
                • Nguồn cần xác minh: <strong>{consistency?.placeholderSummary.referencePlaceholders || 0}</strong>
              </p>
            </div>
          </div>

          {/* Consistency Check Alerts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Kiểm tra Nhất quán Kỹ thuật</h3>
            {consistency?.conflicts && consistency.conflicts.length > 0 ? (
              <ul className="text-xs text-amber-800 list-disc list-inside space-y-1">
                {consistency.conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-700 font-semibold">
                ✓ Không phát hiện mâu thuẫn số liệu kỹ thuật giữa các phần.
              </p>
            )}
          </div>
        </div>

        {/* ASSEMBLED DOCUMENT FULL TEXT DISPLAY */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="prose prose-slate max-w-none text-xs leading-relaxed font-serif whitespace-pre-wrap">
            {draft?.plainText || "Chưa có nội dung bản thảo."}
          </div>
        </div>

        {/* FINAL CONFIRMATION BOX */}
        {!isCompletedReviewStage && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xác nhận Hoàn thành Phần Soạn thảo</h3>
            <p className="text-xs text-slate-500">
              Khi Thầy/Cô đã kiểm tra bản thảo toàn văn, hãy đánh dấu xác nhận để chuyển sang Bước 5: Rà soát & Đánh giá.
            </p>

            <div className="flex items-start gap-2 pt-2">
              <input
                id="writerConfirmCheck"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="writerConfirmCheck" className="text-xs text-slate-700">
                Tôi đã kiểm tra bản thảo toàn bài và xác nhận chuyển sang bước rà soát.
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={completing || !confirmed}
                onClick={handleCompleteWriterStage}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
              >
                {completing ? "Đang hoàn tất..." : "Hoàn thành Phần Viết (Sang Bước 5: Rà soát) →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
