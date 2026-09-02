"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  ProjectReviewRunRecord,
  ProjectReviewFindingRecord,
  RubricCriterion,
  PriorityRevision,
} from "@/types/review";
import type { ProjectDocumentDraftRecord } from "@/types/writer";
import type { ProjectRecord } from "@/types/project";

export default function ProjectReviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [draft, setDraft] = useState<ProjectDocumentDraftRecord | null>(null);
  const [latestRun, setLatestRun] = useState<ProjectReviewRunRecord | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Categorized findings
  const [mandatoryFixes, setMandatoryFixes] = useState<ProjectReviewFindingRecord[]>([]);
  const [qualityImprovements, setQualityImprovements] = useState<ProjectReviewFindingRecord[]>([]);
  const [keepAsIs, setKeepAsIs] = useState<ProjectReviewFindingRecord[]>([]);
  const [priorityRevisions, setPriorityRevisions] = useState<ProjectReviewFindingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"mandatory" | "quality" | "keep" | "rubric">("mandatory");

  // Actions state
  const [reviewing, setReviewing] = useState(false);
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviewState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/review`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải trạng thái rà soát.");
      } else {
        setProject(json.data.project);
        setDraft(json.data.draft);
        setLatestRun(json.data.latestRun);
        setIsStale(json.data.isStale);
        setMandatoryFixes(json.data.mandatoryFixes || []);
        setQualityImprovements(json.data.qualityImprovements || []);
        setKeepAsIs(json.data.keepAsIs || []);
        setPriorityRevisions(json.data.priorityRevisions || []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleRunReview = async () => {
    setReviewing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Rà soát toàn bài thất bại.");
      } else {
        setSuccessMsg("Đã hoàn thành rà soát toàn bộ bản thảo (AI Reviewer)!");
        fetchReviewState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setReviewing(false);
    }
  };

  const handleUpdateFindingStatus = async (findingId: string, status: string) => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/review/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchReviewState();
      }
    } catch {
      setErrorMsg("Không thể cập nhật trạng thái nhận xét");
    }
  };

  const handleTargetedRevision = async (findingId: string) => {
    setRevisingId(findingId);
    setErrorMsg(null);
    try {
      const requestId = `req_rev_t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/review/findings/${findingId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Tạo bản sửa thất bại");
      } else {
        setSuccessMsg("Đã tạo phiên bản chỉnh sửa mới và đánh dấu đã xử lý!");
        fetchReviewState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setRevisingId(null);
    }
  };

  const handleCompleteReview = async () => {
    if (!confirmed) return;
    setCompleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/review/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Hoàn thành rà soát thất bại");
      } else {
        setSuccessMsg("Đã hoàn thành Bước 5 (Rà soát)! Dự án sẵn sàng chuyển sang Bước 6: Hoàn thiện hồ sơ.");
        setProject(json.data.project);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải không gian AI Reviewer...</div>;
  }

  const rubricList: RubricCriterion[] = latestRun?.summaryJson?.rubric || [];
  const openBlockers = mandatoryFixes.filter((f) => f.severity === "BLOCKING" && f.status === "OPEN").length;
  const isCompletedFinalize = project?.workflowStage === "FINALIZE";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                Bước 5 / 6: AI Reviewer
              </span>
              <span className="text-xs text-slate-500">
                {latestRun ? `Phiên bản rà soát: v${latestRun.reviewVersion}` : "Chưa rà soát"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Rà soát Toàn văn & Đánh giá Rubric
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.projectId}/document`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← Xem Bản thảo Toàn bài
            </Link>
            <button
              type="button"
              disabled={reviewing}
              onClick={handleRunReview}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {reviewing ? "Đang rà soát AI..." : latestRun ? "Rà soát lại toàn bài" : "Rà soát toàn bộ bản thảo"}
            </button>
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

        {/* STALE WARNING */}
        {isStale && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            ⚠️ <strong>Bản rà soát này dựa trên phiên bản cũ của tài liệu.</strong> Thầy/Cô hãy bấm <em>&quot;Rà soát lại toàn bài&quot;</em> để cập nhật đánh giá mới nhất.
          </div>
        )}

        {/* COMPLETED BANNER */}
        {isCompletedFinalize && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <h2 className="text-base font-bold text-emerald-900">Rà soát đã hoàn thành</h2>
            </div>
            <p className="text-xs text-emerald-800">
              Dự án đã sẵn sàng cho giai đoạn <strong>Bước 6: Hoàn thiện hồ sơ & Báo cáo bảo vệ (Phase 9)</strong>.
            </p>
          </div>
        )}

        {/* REVIEW SUMMARY OVERVIEW */}
        {latestRun?.summaryJson && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Tổng quan Đánh giá từ Hội đồng</h2>
            <p className="text-xs text-slate-700 leading-relaxed font-serif">
              {latestRun.summaryJson.overallAssessment}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">
                  ✓ Điểm mạnh nổi bật:
                </span>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                  {(latestRun.summaryJson.strengths || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">
                  ⚠️ Rủi ro / Điểm cần chú ý:
                </span>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                  {(latestRun.summaryJson.mainRisks || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* EXACTLY 3 PRIORITY REVISIONS HIGHLIGHT */}
        {priorityRevisions.length === 3 && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-indigo-950 uppercase tracking-wide">
                ⭐ 3 Chỉnh sửa Ưu tiên Lớn nhất
              </h3>
              <span className="text-xs text-indigo-700 font-medium">Theo mức độ ảnh hưởng</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {priorityRevisions.map((p) => (
                <div key={p.id} className="rounded-xl border border-indigo-200/80 bg-white p-4 shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                      ƯU TIÊN {p.priorityNumber}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{p.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-serif">{p.description}</p>
                    <div className="rounded bg-slate-50 p-2 text-[10px] text-slate-700 space-y-1">
                      <p><strong>Cách sửa:</strong> {p.suggestedFix}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">Trạng thái: {p.status}</span>
                    <button
                      type="button"
                      disabled={p.status === "RESOLVED" || revisingId === p.id}
                      onClick={() => handleTargetedRevision(p.id)}
                      className="rounded bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition"
                    >
                      {revisingId === p.id ? "Đang sửa..." : p.status === "RESOLVED" ? "✓ Đã xử lý" : "Nhờ AI sửa"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIZED FINDINGS TABS & RUBRIC */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("mandatory")}
              className={`py-3 px-5 border-b-2 transition ${
                activeTab === "mandatory"
                  ? "border-red-600 text-red-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Lỗi bắt buộc phải sửa ({mandatoryFixes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quality")}
              className={`py-3 px-5 border-b-2 transition ${
                activeTab === "quality"
                  ? "border-amber-600 text-amber-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Điểm có thể nâng chất lượng ({qualityImprovements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("keep")}
              className={`py-3 px-5 border-b-2 transition ${
                activeTab === "keep"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Phần đã tốt và nên giữ ({keepAsIs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rubric")}
              className={`py-3 px-5 border-b-2 transition ${
                activeTab === "rubric"
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              10 Tiêu chí Rubric ({rubricList.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-4">
            {/* MANDATORY FIXES TAB */}
            {activeTab === "mandatory" && (
              <div className="space-y-3">
                {mandatoryFixes.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có lỗi bắt buộc nào.</p>
                ) : (
                  mandatoryFixes.map((f) => (
                    <div key={f.id} className="rounded-xl border border-red-200 bg-red-50/30 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                            {f.severity}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">Trạng thái: {f.status}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-serif">{f.description}</p>
                      {f.whyItMatters && (
                        <p className="text-[11px] text-red-900/80"><strong>Vì sao quan trọng:</strong> {f.whyItMatters}</p>
                      )}
                      {f.suggestedFix && (
                        <p className="text-[11px] text-slate-800"><strong>Gợi ý khắc phục:</strong> {f.suggestedFix}</p>
                      )}
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-red-100">
                        <button
                          type="button"
                          onClick={() => handleUpdateFindingStatus(f.id, "DISMISSED")}
                          className="rounded border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Giữ nguyên
                        </button>
                        <button
                          type="button"
                          disabled={f.status === "RESOLVED" || revisingId === f.id}
                          onClick={() => handleTargetedRevision(f.id)}
                          className="rounded bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
                        >
                          {revisingId === f.id ? "Đang sửa..." : f.status === "RESOLVED" ? "✓ Đã xử lý" : "Nhờ AI sửa"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* QUALITY IMPROVEMENTS TAB */}
            {activeTab === "quality" && (
              <div className="space-y-3">
                {qualityImprovements.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có điểm nâng cao chất lượng nào.</p>
                ) : (
                  qualityImprovements.map((f) => (
                    <div key={f.id} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                        <span className="text-[10px] text-slate-500">Trạng thái: {f.status}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-serif">{f.description}</p>
                      {f.suggestedFix && (
                        <p className="text-[11px] text-slate-800"><strong>Gợi ý:</strong> {f.suggestedFix}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* KEEP AS IS TAB */}
            {activeTab === "keep" && (
              <div className="space-y-3">
                {keepAsIs.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có phần ghi nhận.</p>
                ) : (
                  keepAsIs.map((f) => (
                    <div key={f.id} className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-1">
                      <h4 className="text-xs font-bold text-emerald-950">✓ {f.title}</h4>
                      <p className="text-xs text-slate-700 font-serif">{f.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 10 RUBRIC CRITERIA TAB */}
            {activeTab === "rubric" && (
              <div className="space-y-4">
                {rubricList.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có đánh giá rubric.</p>
                ) : (
                  rubricList.map((r, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{r.criterion}</h4>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          r.assessment === "STRONG"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.assessment === "ADEQUATE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {r.assessment}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong>Điểm mạnh:</strong> {r.strengths}</p>
                        <p><strong>Vấn đề:</strong> {r.issues}</p>
                        <p><strong>Khuyến nghị:</strong> {r.recommendation}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* FINAL CONFIRMATION & COMPLETION */}
        {!isCompletedFinalize && (
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xác nhận Hoàn thành Bước Rà soát</h3>
            <p className="text-xs text-slate-500">
              Khi Thầy/Cô đã xem báo cáo rà soát và xử lý các lỗi bắt buộc, hãy đánh dấu xác nhận để chuyển sang Bước 6: Hoàn thiện hồ sơ & Chuẩn bị bảo vệ.
            </p>

            {openBlockers > 0 && (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                ⚠️ Hiện còn <strong>{openBlockers}</strong> lỗi bắt buộc (BLOCKING) chưa xử lý. Thầy/Cô cần xử lý trước khi hoàn thành rà soát.
              </div>
            )}

            <div className="flex items-start gap-2 pt-2">
              <input
                id="reviewConfirmCheck"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="reviewConfirmCheck" className="text-xs text-slate-700">
                Tôi đã xem báo cáo rà soát, đã xử lý các lỗi bắt buộc và xác nhận hoàn thành bước rà soát.
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={completing || !confirmed || openBlockers > 0}
                onClick={handleCompleteReview}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 transition"
              >
                {completing ? "Đang hoàn tất..." : "Hoàn thành Rà soát (Sang Bước 6: Hoàn thiện) →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
