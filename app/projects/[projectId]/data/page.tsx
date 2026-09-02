"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DATA_GROUPS } from "@/lib/data/project-fact-registry";
import type {
  DataGroupKey,
  SmartQuestion,
  DataCompletenessSummary,
  DataConflict,
} from "@/types/data-collection";
import type { ProjectRecord } from "@/types/project";

export default function ProjectDataStepPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [facts, setFacts] = useState<Record<string, unknown>>({});
  const [completeness, setCompleteness] = useState<DataCompletenessSummary | null>(null);
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);

  // Navigation
  const [activeGroup, setActiveGroup] = useState<DataGroupKey>("GENERAL");

  // Smart Questions
  const [questions, setQuestions] = useState<SmartQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Status messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Completion
  const [confirmed, setConfirmed] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchDataState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDataState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/data`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải dữ liệu.");
      } else {
        setProject(json.data.project);
        setFacts(json.data.facts || {});
        setCompleteness(json.data.completeness);
        setConflicts(json.data.conflicts || []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSmartQuestions = async () => {
    setFetchingQuestions(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/data/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tạo câu hỏi thông minh.");
      } else {
        setQuestions(json.data.questions || []);
        setSuccessMsg("Đã tạo đợt câu hỏi thông minh thành công!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi tạo câu hỏi");
    } finally {
      setFetchingQuestions(false);
    }
  };

  const handleSaveAnswer = async (fieldKey: string) => {
    const value = answers[fieldKey];
    if (value === undefined || value === null || String(value).trim() === "") return;

    setSavingField(fieldKey);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${params.projectId}/data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey,
          value,
          sourceType: "USER_ENTERED",
          verificationStatus: "VERIFIED_BY_USER",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || `Không thể lưu trường ${fieldKey}.`);
      } else {
        setSuccessMsg(`Đã lưu trường '${fieldKey}' thành công!`);
        // Remove question from active list
        setQuestions((prev) => prev.filter((q) => q.fieldKey !== fieldKey));
        fetchDataState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi lưu dữ liệu");
    } finally {
      setSavingField(null);
    }
  };

  const handleCompleteDataStage = async () => {
    if (!confirmed) return;
    setCompleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/projects/${params.projectId}/data/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Hoàn thành Bước 2 thất bại.");
      } else {
        setSuccessMsg("Đã hoàn thành thu thập dữ liệu! Dự án sẵn sàng sang Bước 3.");
        fetchDataState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải dữ liệu Bước 2...</div>;
  }

  const isCompleted = project?.workflowStage !== "TOPIC" && project?.workflowStage !== "DATA";

  const percentComplete = completeness
    ? Math.round((completeness.requiredComplete / Math.max(1, completeness.requiredTotal)) * 100)
    : 0;

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
              Thu thập Dữ liệu thực tế
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đề tài chính thức: <strong>{project?.title}</strong>
            </p>
          </div>

          <Link
            href={`/projects/${params.projectId}`}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition self-start sm:self-auto"
          >
            ← Về Không gian dự án
          </Link>
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

        {/* Conflict Warning Alert */}
        {conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
            <h3 className="text-xs font-bold text-amber-900">⚠️ Phát hiện mâu thuẫn / Cần kiểm tra lại:</h3>
            <ul className="text-xs text-amber-800 list-disc list-inside space-y-1">
              {conflicts.map((c, i) => (
                <li key={i}>{c.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* COMPLETION BANNER IF ALREADY COMPLETED */}
        {isCompleted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <h2 className="text-base font-bold text-emerald-900">Dữ liệu thực tế đã được thu thập đầy đủ</h2>
            </div>
            <p className="text-xs text-emerald-800">
              Giai đoạn thu thập dữ liệu đã hoàn tất! Dự án đã sẵn sàng chuyển sang <strong>Bước 3: Xây dựng khung cấu trúc</strong>.
            </p>
          </div>
        ) : null}

        {/* Completeness Indicator Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Mức độ hoàn thành dữ liệu bắt buộc:</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                completeness?.status === "READY_FOR_STRUCTURE"
                  ? "bg-emerald-100 text-emerald-800"
                  : completeness?.status === "MINIMUM_READY"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {completeness?.status === "READY_FOR_STRUCTURE"
                ? "Sẵn sàng sang Bước 3"
                : completeness?.status === "MINIMUM_READY"
                ? "Đủ dữ liệu tối thiểu"
                : "Chưa đủ dữ liệu"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                percentComplete >= 100 ? "bg-emerald-600" : percentComplete >= 50 ? "bg-blue-600" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, percentComplete)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Đã hoàn thành {completeness?.requiredComplete} / {completeness?.requiredTotal} trường bắt buộc ({percentComplete}%)
            </span>
            {completeness && completeness.missingRequired.length > 0 && (
              <span className="text-amber-700 font-semibold">
                Còn thiếu {completeness.missingRequired.length} trường bắt buộc
              </span>
            )}
          </div>
        </div>

        {/* 8 Data Groups Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {DATA_GROUPS.map((grp) => {
            const isActive = activeGroup === grp.key;
            return (
              <button
                key={grp.key}
                type="button"
                onClick={() => setActiveGroup(grp.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{grp.icon}</span>
                <span>{grp.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Group Details & Saved Facts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {DATA_GROUPS.find((g) => g.key === activeGroup)?.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {DATA_GROUPS.find((g) => g.key === activeGroup)?.description}
            </p>
          </div>

          {/* Group Specific Fact List */}
          <div className="space-y-3">
            {Object.entries(facts)
              .filter(([k]) => {
                if (activeGroup === "GENERAL") return ["school_name", "education_level", "subject_group", "grade_level", "school_year", "implementation_period"].includes(k);
                if (activeGroup === "TARGET_GROUP") return ["target_group", "experimental_class", "experimental_student_count", "has_comparison_group", "comparison_class", "comparison_student_count"].includes(k);
                if (activeGroup === "REALITY") return ["current_problem", "observable_manifestations", "problem_statement"].includes(k);
                if (activeGroup === "CAUSES") return ["main_causes"].includes(k);
                if (activeGroup === "GOALS") return ["target_goals", "initial_goal"].includes(k);
                if (activeGroup === "SOLUTIONS") return ["proposed_interventions"].includes(k);
                if (activeGroup === "EVIDENCE") return ["evidence_types", "evidence_status"].includes(k);
                if (activeGroup === "LOCAL_RULES") return ["has_no_local_requirements", "local_guidelines"].includes(k);
                return false;
              })
              .map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{k}</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      ✓ Đã lưu
                    </span>
                  </div>
                  <p className="mt-1 text-slate-900 font-medium whitespace-pre-wrap">{String(v)}</p>
                </div>
              ))}
          </div>

          {/* Smart Questions Trigger Button */}
          {!isCompleted && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Thầy/Cô có thể trả lời câu hỏi gợi mở để bổ sung thông tin nhanh chóng.
              </span>
              <button
                type="button"
                disabled={fetchingQuestions}
                onClick={handleFetchSmartQuestions}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {fetchingQuestions ? "Đang tạo câu hỏi..." : "Tạo đợt câu hỏi thông minh (3–5 câu)"}
              </button>
            </div>
          )}
        </div>

        {/* SMART QUESTIONS INTERACTIVE CARDS */}
        {questions.length > 0 && !isCompleted && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Đợt câu hỏi thông minh ({questions.length} câu)
            </h3>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Nhóm: {q.group}
                    </span>
                    {q.required && <span className="text-[10px] font-bold text-red-600">* Bắt buộc</span>}
                  </div>

                  <p className="text-sm font-bold text-slate-900">{q.question}</p>
                  {q.helpText && <p className="text-xs text-slate-500">{q.helpText}</p>}

                  {/* Input Rendering based on answerType */}
                  <div className="pt-2">
                    {q.answerType === "LONG_TEXT" ? (
                      <textarea
                        rows={3}
                        value={(answers[q.fieldKey] as string) || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.fieldKey]: e.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
                        placeholder="Nhập nội dung chi tiết..."
                      />
                    ) : q.answerType === "NUMBER" ? (
                      <input
                        type="number"
                        value={(answers[q.fieldKey] as string) || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.fieldKey]: e.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
                        placeholder="Nhập số lượng..."
                      />
                    ) : q.answerType === "YES_NO" ? (
                      <select
                        value={(answers[q.fieldKey] as string) || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.fieldKey]: e.target.value === "true" })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
                      >
                        <option value="">-- Chọn lựa chọn --</option>
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    ) : q.options && q.options.length > 0 ? (
                      <select
                        value={(answers[q.fieldKey] as string) || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.fieldKey]: e.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
                      >
                        <option value="">-- Chọn giá trị --</option>
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={(answers[q.fieldKey] as string) || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.fieldKey]: e.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
                        placeholder="Nhập thông tin..."
                      />
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={savingField === q.fieldKey || !answers[q.fieldKey]}
                      onClick={() => handleSaveAnswer(q.fieldKey)}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
                    >
                      {savingField === q.fieldKey ? "Đang lưu..." : "Lưu câu trả lời"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINAL CONFIRMATION & COMPLETION SECTION */}
        {!isCompleted && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xác nhận Hoàn thành Thu thập Dữ liệu</h3>
            <p className="text-xs text-slate-500">
              Khi các dữ liệu bắt buộc đã đầy đủ, Thầy/Cô hãy đánh dấu xác nhận để chuyển sang Bước 3: Xây dựng khung cấu trúc.
            </p>

            <div className="flex items-start gap-2 pt-2">
              <input
                id="dataConfirmCheck"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="dataConfirmCheck" className="text-xs text-slate-700">
                Tôi xác nhận các dữ liệu bắt buộc đã được kiểm tra và là số liệu / dữ liệu thực tế của dự án.
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={completing || !confirmed || completeness?.status === "INCOMPLETE"}
                onClick={handleCompleteDataStage}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
              >
                {completing ? "Đang hoàn tất..." : "Hoàn thành Thu thập Dữ liệu (Sang Bước 3) →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
