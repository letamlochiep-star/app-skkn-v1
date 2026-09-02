"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  TopicCandidate,
  TopicAnalysisResult,
  TopicSuggestionsResult,
  TopicInputStatus,
} from "@/types/topic";
import type { ProjectRecord } from "@/types/project";

export default function ProjectTopicStepPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [locked, setLocked] = useState(false);
  const [officialTitle, setOfficialTitle] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<TopicCandidate[]>([]);
  const [inputStatus, setInputStatus] = useState<TopicInputStatus | null>(null);

  // Mode: "HAVE_TITLE" | "NEED_SUGGESTIONS"
  const [mode, setMode] = useState<"HAVE_TITLE" | "NEED_SUGGESTIONS">("HAVE_TITLE");
  const [customTitle, setCustomTitle] = useState("");

  // AI Loading & Result states
  const [aiLoading, setAiLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TopicAnalysisResult | null>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<TopicSuggestionsResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selection & Lock State
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | undefined>();
  const [confirmed, setConfirmed] = useState(false);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    fetchTopicState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTopicState = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/topic`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setProject(data.project);
        setLocked(data.locked);
        setOfficialTitle(data.officialTitle);
        setCandidates(data.candidates || []);
        setInputStatus(data.inputStatus);
        setCustomTitle(data.workingTitle || "");
        if (data.locked && data.officialTitle) {
          setSelectedTitle(data.officialTitle);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!customTitle.trim()) return;
    setAiLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setAnalysisResult(null);

    try {
      const requestId = `req_ana_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch(`/api/projects/${params.projectId}/topic/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle,
          requestId,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMsg(json.message || "Phân tích tên đề tài thất bại.");
      } else {
        setAnalysisResult(json.data.analysis);
        setCandidates(json.data.candidates);
        setSuccessMsg("Phân tích tên đề tài thành công!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối AI");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggest = async () => {
    setAiLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSuggestionsResult(null);

    try {
      const requestId = `req_sug_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch(`/api/projects/${params.projectId}/topic/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMsg(json.message || "Gợi ý tên đề tài thất bại.");
      } else {
        setSuggestionsResult(json.data.suggestions);
        setCandidates(json.data.candidates);
        setSuccessMsg("Đã tạo 5 gợi ý tên đề tài thành công!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối AI");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectCandidate = (title: string, candId?: string) => {
    setSelectedTitle(title);
    setSelectedCandidateId(candId);
    setConfirmed(false);
  };

  const handleLockTopic = async () => {
    if (!confirmed || !selectedTitle.trim()) return;
    setLocking(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/projects/${params.projectId}/topic/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          finalTitle: selectedTitle,
          confirmed: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMsg(json.message || "Chốt tên đề tài thất bại.");
      } else {
        setLocked(true);
        setOfficialTitle(selectedTitle);
        setSuccessMsg("Đã chốt tên đề tài chính thức thành công!");
        fetchTopicState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLocking(false);
    }
  };

  const handleUnlockTopic = async () => {
    if (!confirm("Thầy/Cô có chắc chắn muốn mở khóa tên đề tài để chỉnh sửa lại?")) return;
    try {
      const res = await fetch(`/api/projects/${params.projectId}/topic/unlock`, {
        method: "POST",
      });
      if (res.ok) {
        setLocked(false);
        fetchTopicState();
      }
    } catch {
      // fallback
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải thông tin Bước 1...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                Bước 1 / 6
              </span>
              <span className="text-xs text-slate-500">
                {project?.documentType === "SKKN" ? "Sáng kiến kinh nghiệm" : "Giải pháp hữu ích"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Xác định và Chốt tên Đề tài
            </h1>
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

        {/* LOCKED STATE BANNER */}
        {locked ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <h2 className="text-base font-bold text-emerald-900">Tên đề tài đã được chốt chính thức</h2>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-white p-5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Tên đề tài chính thức:
              </span>
              <p className="mt-1 text-base font-bold text-slate-900 leading-relaxed">
                {officialTitle || project?.title}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-xs text-emerald-800">
                Bước 1 đã hoàn thành! Dự án đã sẵn sàng chuyển sang <strong>Bước 2: Thu thập dữ liệu thực tế</strong> (sẽ được kích hoạt ở Phase tiếp theo).
              </p>
              <button
                onClick={handleUnlockTopic}
                className="text-xs text-slate-500 hover:text-slate-700 underline self-start sm:self-auto"
              >
                Mở khóa để chỉnh sửa lại
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Context Facts Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
              <h2 className="font-bold text-slate-900">Thông tin sư phạm nền tảng</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-slate-600">
                <div>
                  <span className="text-slate-400">Chuyên môn:</span> <strong>{project?.subjectGroup}</strong> ({project?.educationLevel})
                </div>
                <div>
                  <span className="text-slate-400">Khối lớp:</span> <strong>{project?.gradeLevel || "Toàn cấp"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Năm học:</span> <strong>{project?.schoolYear}</strong>
                </div>
              </div>
              {inputStatus?.known.problemStatement && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block font-medium">Vấn đề thực tế cần giải quyết:</span>
                  <p className="mt-0.5 text-slate-800 italic">{inputStatus.known.problemStatement}</p>
                </div>
              )}
            </div>

            {/* Branch Mode Selector */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() => setMode("HAVE_TITLE")}
                className={`cursor-pointer rounded-2xl border p-5 transition shadow-sm ${
                  mode === "HAVE_TITLE"
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">
                    A
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Tôi đã có tên đề tài</h3>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Tôi muốn trợ lý AI phân tích điểm mạnh, điểm cần chỉnh và đề xuất tối đa 3 phương án tối ưu.
                </p>
              </div>

              <div
                onClick={() => setMode("NEED_SUGGESTIONS")}
                className={`cursor-pointer rounded-2xl border p-5 transition shadow-sm ${
                  mode === "NEED_SUGGESTIONS"
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
                    B
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Tôi chưa có tên đề tài</h3>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Tôi muốn trợ lý AI gợi ý 5 tên đề tài chuẩn thể thức dựa trên vấn đề thực tế đã nhập.
                </p>
              </div>
            </div>

            {/* BRANCH A: HAVE TITLE */}
            {mode === "HAVE_TITLE" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Phân tích Tên đề tài hiện có</h3>

                <div>
                  <label htmlFor="customTitle" className="block text-xs font-semibold text-slate-700">
                    Nhập tên đề tài Thầy/Cô đang dự định viết
                  </label>
                  <textarea
                    id="customTitle"
                    rows={2}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ví dụ: Nâng cao năng lực giải quyết vấn đề toán học thực tế cho học sinh lớp 8..."
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={aiLoading || !customTitle.trim()}
                  onClick={handleAnalyze}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {aiLoading ? "Đang phân tích tên đề tài..." : "Phân tích tên đề tài"}
                </button>

                {/* Analysis Output View */}
                {analysisResult && (
                  <div className="mt-6 space-y-5 pt-5 border-t border-slate-200">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Strengths */}
                      <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                        <h4 className="text-xs font-bold text-green-900">Điểm mạnh của tên đề tài</h4>
                        <ul className="mt-2 space-y-1 text-xs text-green-800 list-disc list-inside">
                          {analysisResult.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Points to Revise */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                        <h4 className="text-xs font-bold text-amber-900">Điểm cần lưu ý & hoàn thiện</h4>
                        <ul className="mt-2 space-y-1 text-xs text-amber-800 list-disc list-inside">
                          {analysisResult.needsRevision.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 3 Suggestions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900">Các phương án tối ưu được gợi ý</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {analysisResult.suggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectCandidate(sug.title)}
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              selectedTitle === sug.title
                                ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                Phương án {idx + 1}: {sug.direction === "SAFE" ? "An toàn" : sug.direction === "INTERVENTION_FOCUS" ? "Làm rõ biện pháp" : "Nhấn mạnh phạm vi"}
                              </span>
                              <button
                                type="button"
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                Chọn phương án này →
                              </button>
                            </div>
                            <p className="mt-2 text-sm font-bold text-slate-900">{sug.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{sug.rationale}</p>
                            <p className="mt-1 text-[11px] text-slate-400">Khả năng minh chứng: {sug.evidenceFeasibility}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BRANCH B: NEED SUGGESTIONS */}
            {mode === "NEED_SUGGESTIONS" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Gợi ý 5 Tên đề tài từ bối cảnh thực tế</h3>

                {inputStatus && !inputStatus.readyForSuggestion && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    <p className="font-bold">Cần bổ sung thông tin để gợi ý chính xác:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {inputStatus.missing.map((m) => (
                        <li key={m.key}>{m.label}: {m.description}</li>
                      ))}
                    </ul>
                    <Link
                      href={`/projects/${params.projectId}/settings`}
                      className="mt-2 inline-block font-semibold text-blue-600 underline"
                    >
                      Bổ sung trong Cài đặt dự án →
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  disabled={aiLoading || (inputStatus ? !inputStatus.readyForSuggestion : false)}
                  onClick={handleSuggest}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  {aiLoading ? "Đang tạo 5 phương án đề tài..." : "Gợi ý 5 tên đề tài"}
                </button>

                {/* 5 Topic Suggestions Cards */}
                {suggestionsResult && (
                  <div className="mt-6 space-y-3 pt-5 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-900">5 Phương án đề tài chuẩn thể thức:</h4>

                    <div className="grid grid-cols-1 gap-3">
                      {suggestionsResult.topics.map((top, idx) => {
                        const isRecommended = idx === suggestionsResult.recommendedIndex;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectCandidate(top.title)}
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              selectedTitle === top.title
                                ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">Phương án #{idx + 1}</span>
                                {isRecommended && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    ★ AI Khuyến nghị
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="text-xs font-semibold text-emerald-700 hover:underline"
                              >
                                Chọn phương án này →
                              </button>
                            </div>

                            <p className="mt-2 text-sm font-bold text-slate-900">{top.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{top.rationale}</p>
                            <p className="mt-1 text-[11px] text-slate-400">Khả năng minh chứng: {top.evidenceFeasibility}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SELECTION & CONFIRMATION LOCK ZONE */}
            {selectedTitle && (
              <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Xác nhận và Chốt tên Đề tài</h3>

                <div>
                  <label htmlFor="selectedTitle" className="block text-xs font-semibold text-slate-700">
                    Tên đề tài đã chọn (Thầy/Cô có thể chỉnh sửa thủ công trực tiếp nếu cần):
                  </label>
                  <input
                    id="selectedTitle"
                    type="text"
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500"
                  />
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    id="confirmCheck"
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="confirmCheck" className="text-xs text-slate-700">
                    Tôi xác nhận đây là tên đề tài chính thức tôi lựa chọn cho dự án này.
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={locking || !confirmed || !selectedTitle.trim()}
                    onClick={handleLockTopic}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
                  >
                    {locking ? "Đang chốt tên đề tài..." : "Chốt tên đề tài chính thức"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
