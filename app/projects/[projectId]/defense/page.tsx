"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  DefenseDuration,
  ProjectDefensePackageRecord,
  ProjectDefenseComponentRecord,
  DefenseOutline,
  DefenseScript,
  DefenseSlide,
  DefenseSpeakerNote,
  JuryQuestionItem,
  AnswerFrameworkItem,
  OnePageSummary,
} from "@/types/defense";
import type { ProjectRecord } from "@/types/project";

export default function ProjectDefensePage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [pkg, setPkg] = useState<ProjectDefensePackageRecord | null>(null);
  const [components, setComponents] = useState<ProjectDefenseComponentRecord[]>([]);
  const [isStale, setIsStale] = useState(false);

  // Duration selection
  const [durationMinutes, setDurationMinutes] = useState<DefenseDuration>(7);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"outline" | "script" | "slides" | "notes" | "qa" | "summary">("outline");

  // Completion state
  const [confirmed, setConfirmed] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDefenseState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDefenseState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/defense`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải gói báo cáo bảo vệ.");
      } else {
        setProject(json.data.project);
        setPkg(json.data.package);
        setComponents(json.data.components || []);
        setIsStale(json.data.isStale);
        if (json.data.package?.durationMinutes) {
          setDurationMinutes(json.data.package.durationMinutes);
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_def_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/defense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes, requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Khởi tạo gói bảo vệ thất bại");
      } else {
        setSuccessMsg(`Đã tạo gói báo cáo bảo vệ ${durationMinutes} phút!`);
        fetchDefenseState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateComponent = async (type: string) => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const requestId = `req_gen_${type}_${Date.now()}`;
      const res = await fetch(`/api/projects/${params.projectId}/defense/${type.toLowerCase().replace(/_/g, "-")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || `Tạo ${type} thất bại`);
      } else {
        setSuccessMsg(`Đã tạo nội dung ${type} thành công!`);
        fetchDefenseState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteDefense = async () => {
    if (!confirmed) return;
    setCompleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/defense/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Hoàn thành gói bảo vệ thất bại");
      } else {
        setSuccessMsg("Đã hoàn thành chuẩn bị gói báo cáo bảo vệ trước Ban Giám Khảo!");
        fetchDefenseState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang chuẩn bị không gian Báo cáo bảo vệ...</div>;
  }

  // Component extractors
  const outlineComp = components.find((c) => c.componentType === "OUTLINE");
  const outlineData = outlineComp?.contentJson as unknown as DefenseOutline | undefined;

  const scriptComp = components.find((c) => c.componentType === "SCRIPT");
  const scriptData = scriptComp?.contentJson as unknown as DefenseScript | undefined;

  const slidesComp = components.find((c) => c.componentType === "SLIDES");
  const slidesData = (slidesComp?.contentJson as any)?.slides as DefenseSlide[] | undefined;

  const notesComp = components.find((c) => c.componentType === "SPEAKER_NOTES");
  const notesData = (notesComp?.contentJson as any)?.notes as DefenseSpeakerNote[] | undefined;

  const questionsComp = components.find((c) => c.componentType === "JURY_QUESTIONS");
  const questionsData = (questionsComp?.contentJson as any)?.questions as JuryQuestionItem[] | undefined;

  const answersComp = components.find((c) => c.componentType === "ANSWER_FRAMEWORKS");
  const answersData = (answersComp?.contentJson as any)?.frameworks as AnswerFrameworkItem[] | undefined;

  const summaryComp = components.find((c) => c.componentType === "ONE_PAGE_SUMMARY");
  const summaryData = summaryComp?.contentJson as unknown as OnePageSummary | undefined;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Bước 6 / 6: Báo cáo bảo vệ BGK
              </span>
              <span className="text-xs text-slate-500">
                {pkg ? `Thời lượng: ${pkg.durationMinutes} phút (v${pkg.version})` : "Chưa khởi tạo"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Báo cáo Trình bày & Bảo vệ Giải pháp trước BGK
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.projectId}/defense/practice`}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Phòng Luyện bảo vệ (Mock Jury) →
            </Link>
            <Link
              href={`/projects/${params.projectId}/review`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về Rà soát
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

        {/* STALE WARNING */}
        {isStale && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            ⚠️ <strong>Bản thảo tài liệu đã được cập nhật.</strong> Gói báo cáo bảo vệ hiện tại dựa trên phiên bản cũ. Thầy/Cô hãy tạo lại gói bảo vệ để cập nhật thông tin mới nhất.
          </div>
        )}

        {/* DURATION SELECTION CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lựa chọn Thời lượng Thuyết trình</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình dung lượng bài nói và số lượng slide phù hợp với quy định của Hội đồng chấm.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[5, 7, 10].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMinutes(d as DefenseDuration)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    durationMinutes === d
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {d} Phút
                </button>
              ))}

              <button
                type="button"
                disabled={generating}
                onClick={handleCreatePackage}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {generating ? "Đang xử lý..." : pkg ? "Cập nhật thời lượng" : "Khởi tạo gói bảo vệ"}
              </button>
            </div>
          </div>
        </div>

        {/* DEFENSE TABS */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("outline")}
              className={`py-3 px-5 border-b-2 whitespace-nowrap transition ${
                activeTab === "outline" ? "border-emerald-600 text-emerald-800 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Dàn ý ({outlineData?.segments?.length || 0} mục)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("script")}
              className={`py-3 px-5 border-b-2 whitespace-nowrap transition ${
                activeTab === "script" ? "border-emerald-600 text-emerald-800 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Bài trình bày ({scriptData?.sections?.length || 0} đoạn)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("slides")}
              className={`py-3 px-5 border-b-2 whitespace-nowrap transition ${
                activeTab === "slides" ? "border-emerald-600 text-emerald-800 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              3. Slide ({slidesData?.length || 0} slide)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`py-3 px-5 border-b-2 whitespace-nowrap transition ${
                activeTab === "notes" ? "border-emerald-600 text-emerald-800 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              4. Ghi chú diễn giả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qa")}
              className={`py-3 px-5 border-b-2 whitespace-nowrap transition ${
                activeTab === "qa" ? "border-emerald-600 text-emerald-800 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              5. Câu hỏi BGK ({questionsData?.length || 0} câu)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`py-3 px-5 border-b-2 whitespace-nowrap transition ${
                activeTab === "summary" ? "border-emerald-600 text-emerald-800 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              6. Tóm tắt 1 trang
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6 space-y-4">
            {/* OUTLINE TAB */}
            {activeTab === "outline" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Dàn ý & Phân bổ Thời gian (Time Budget)</h3>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleGenerateComponent("OUTLINE")}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {outlineData ? "Tạo lại dàn ý" : "Tạo dàn ý"}
                  </button>
                </div>

                {!outlineData ? (
                  <p className="text-xs text-slate-500">Chưa có dàn ý. Bấm &quot;Tạo dàn ý&quot; để sinh cấu trúc thuyết trình.</p>
                ) : (
                  <div className="space-y-3">
                    {outlineData.segments.map((s) => (
                      <div key={s.order} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{s.order}. {s.title}</span>
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">{s.durationSeconds} giây</span>
                        </div>
                        <p className="text-xs text-slate-600">{s.purpose}</p>
                        <ul className="text-xs text-slate-700 list-disc list-inside pt-1">
                          {s.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SCRIPT TAB */}
            {activeTab === "script" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Bài nói Thuyết trình (Oral Script)</h3>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleGenerateComponent("SCRIPT")}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {scriptData ? "Tạo lại bài nói" : "Tạo bài nói"}
                  </button>
                </div>

                {!scriptData ? (
                  <p className="text-xs text-slate-500">Chưa có bài nói. Bấm &quot;Tạo bài nói&quot; để tạo lời thuyết trình tự nhiên.</p>
                ) : (
                  <div className="space-y-4">
                    {scriptData.sections.map((sec, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 block">ĐOẠN {idx + 1} ({sec.durationSeconds}s)</span>
                        <p className="text-xs leading-relaxed text-slate-800 font-serif">{sec.spokenText}</p>
                      </div>
                    ))}
                    {scriptData.closingStatement && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-xs font-serif text-emerald-950">
                        <strong>Lời kết:</strong> {scriptData.closingStatement}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SLIDES TAB */}
            {activeTab === "slides" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Nội dung Slide Trình chiếu (Slide Content Model)</h3>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleGenerateComponent("SLIDES")}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {slidesData ? "Tạo lại slide" : "Tạo slide"}
                  </button>
                </div>

                {!slidesData ? (
                  <p className="text-xs text-slate-500">Chưa có slide. Bấm &quot;Tạo slide&quot; để sinh nội dung từng trang chiếu.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slidesData.map((s) => (
                      <div key={s.slideNumber} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">Slide {s.slideNumber}</span>
                          <span className="text-[10px] text-slate-500">{s.estimatedSeconds}s</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                        <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                          {s.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
                        </ul>
                        <div className="rounded bg-blue-50 p-2 text-[10px] text-blue-900">
                          <strong>Thông điệp:</strong> {s.keyMessage}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SPEAKER NOTES TAB */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Ghi chú Diễn giả (Speaker Notes)</h3>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleGenerateComponent("SPEAKER_NOTES")}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {notesData ? "Tạo lại ghi chú" : "Tạo ghi chú"}
                  </button>
                </div>

                {!notesData ? (
                  <p className="text-xs text-slate-500">Chưa có ghi chú diễn giả.</p>
                ) : (
                  <div className="space-y-3">
                    {notesData.map((n) => (
                      <div key={n.slideNumber} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                        <span className="text-xs font-bold text-slate-900">Ghi chú cho Slide {n.slideNumber}</span>
                        <p className="text-xs text-slate-700"><strong>Điểm nhấn:</strong> {n.emphasis.join(", ")}</p>
                        <p className="text-xs text-slate-600"><strong>Chuyển ý:</strong> {n.transition}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* JURY Q&A TAB */}
            {activeTab === "qa" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Câu hỏi BGK & Khung Trả lời (Jury Q&A)</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => handleGenerateComponent("JURY_QUESTIONS")}
                      className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {questionsData ? "Tạo lại câu hỏi" : "Tạo câu hỏi"}
                    </button>
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => handleGenerateComponent("ANSWER_FRAMEWORKS")}
                      className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      {answersData ? "Tạo lại khung trả lời" : "Tạo khung trả lời"}
                    </button>
                  </div>
                </div>

                {!questionsData ? (
                  <p className="text-xs text-slate-500">Chưa có câu hỏi BGK.</p>
                ) : (
                  <div className="space-y-3">
                    {questionsData.map((q) => {
                      const ans = answersData?.find((a) => a.questionId === q.id);
                      return (
                        <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">{q.category} ({q.difficulty})</span>
                            <span className="text-[10px] text-slate-400">Mục đích: {q.whyAsked}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{q.question}</h4>
                          {ans && (
                            <div className="rounded bg-white p-3 border border-slate-200 text-xs text-slate-700 space-y-1">
                              <p><strong>Khung trả lời:</strong> {ans.directAnswer}</p>
                              <p className="text-slate-500 text-[11px]"><strong>Giới hạn/Lưu ý:</strong> {ans.limitations.join("; ")}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ONE-PAGE SUMMARY TAB */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Bản Tóm tắt 1 Trang A4 (One-Page Summary)</h3>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleGenerateComponent("ONE_PAGE_SUMMARY")}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {summaryData ? "Tạo lại tóm tắt" : "Tạo tóm tắt 1 trang"}
                  </button>
                </div>

                {!summaryData ? (
                  <p className="text-xs text-slate-500">Chưa có bản tóm tắt 1 trang.</p>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs font-serif leading-relaxed">
                    <h3 className="text-center font-bold text-sm uppercase text-slate-900">{summaryData.title}</h3>
                    <p><strong>Vấn đề giải quyết:</strong> {summaryData.problem}</p>
                    <div>
                      <strong>Giải pháp cốt lõi:</strong>
                      <ul className="list-disc list-inside">{summaryData.solution.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                    <div>
                      <strong>Điểm cải tiến:</strong>
                      <ul className="list-disc list-inside">{summaryData.improvements.map((im, i) => <li key={i}>{im}</li>)}</ul>
                    </div>
                    <p><strong>Thông điệp kết luận:</strong> {summaryData.closing}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FINAL CONFIRMATION & COMPLETION */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Xác nhận Hoàn tất Gói Báo cáo Bảo vệ</h3>
          <p className="text-xs text-slate-500">
            Khi Thầy/Cô đã kiểm tra toàn bộ Dàn ý, Bài nói, Slide, Ghi chú và Bộ câu hỏi BGK, hãy xác nhận để hoàn tất hồ sơ.
          </p>

          <div className="flex items-start gap-2 pt-2">
            <input
              id="defenseConfirmCheck"
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="defenseConfirmCheck" className="text-xs text-slate-700">
              Tôi đã kiểm tra nội dung báo cáo bảo vệ và xác nhận các số liệu, minh chứng sử dụng đúng với tài liệu đã được rà soát.
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={completing || !confirmed}
              onClick={handleCompleteDefense}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 transition"
            >
              {completing ? "Đang hoàn tất..." : "Hoàn thành Bộ Báo cáo Bảo vệ ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
