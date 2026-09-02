"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  ProjectDefensePracticeSessionRecord,
  ProjectDefensePracticeTurnRecord,
  JuryQuestionItem,
  AnswerEvaluation,
} from "@/types/defense";
import type { ProjectRecord } from "@/types/project";

export default function MockDefensePracticePage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [session, setSession] = useState<ProjectDefensePracticeSessionRecord | null>(null);
  const [turns, setTurns] = useState<ProjectDefensePracticeTurnRecord[]>([]);
  const [questions, setQuestions] = useState<JuryQuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Answering state
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<AnswerEvaluation | null>(null);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    initPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initPractice = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Get defense state
      const resDef = await fetch(`/api/projects/${params.projectId}/defense`);
      const jsonDef = await resDef.json();
      if (!resDef.ok) {
        setErrorMsg(jsonDef.message || "Lỗi tải dữ liệu");
        return;
      }

      setProject(jsonDef.data.project);

      const qComp = (jsonDef.data.components || []).find((c: any) => c.componentType === "JURY_QUESTIONS");
      const qList = (qComp?.contentJson as any)?.questions || [];
      setQuestions(qList);

      // 2. Start or retrieve practice session
      let activeSession = jsonDef.data.practiceSession;
      if (!activeSession) {
        const resStart = await fetch(`/api/projects/${params.projectId}/defense/practice`, { method: "POST" });
        const jsonStart = await resStart.json();
        activeSession = jsonStart.data;
      }
      setSession(activeSession);
      setTurns(jsonDef.data.practiceTurns || []);
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || !session || questions.length === 0) return;
    const currentQ = questions[currentQuestionIndex];
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const requestId = `req_ans_${Date.now()}`;
      const res = await fetch(`/api/projects/${params.projectId}/defense/practice/${session.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          questionText: currentQ.question,
          answerText,
          requestId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Lỗi gửi câu trả lời");
      } else {
        setLatestEvaluation(json.data.evaluationJson);
        setTurns((prev) => [...prev, json.data]);
        setAnswerText("");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setLatestEvaluation(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang khởi tạo phòng Luyện bảo vệ Mock Defense...</div>;
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                Phòng Luyện tập Phản biện
              </span>
              <span className="text-xs text-slate-500">
                Câu hỏi {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Mock Defense: Phản biện cùng Ban Giám Khảo AI
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <Link
            href={`/projects/${params.projectId}/defense`}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            ← Về Gói Báo cáo Bảo vệ
          </Link>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}

        {/* ACTIVE QUESTION PANEL */}
        {currentQ ? (
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">
                Chủ đề: {currentQ.category} ({currentQ.difficulty})
              </span>
              <span className="text-[11px] text-slate-400">Mục đích: {currentQ.whyAsked}</span>
            </div>

            <div className="rounded-xl bg-indigo-50/40 p-4 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-900 uppercase block mb-1">
                Ban Giám khảo hỏi:
              </span>
              <p className="text-sm font-bold text-slate-900">{currentQ.question}</p>
            </div>

            {/* Answer Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Câu trả lời của Thầy/Cô:
              </label>
              <textarea
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Nhập câu trả lời phản biện tại đây..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-serif leading-relaxed text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Hãy trả lời trung thực dựa trên số liệu thực tế đã xác minh
              </span>
              <button
                type="button"
                disabled={submitting || !answerText.trim()}
                onClick={handleSubmitAnswer}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 transition"
              >
                {submitting ? "BGK đang đánh giá..." : "Gửi câu trả lời cho BGK →"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
            Chưa có câu hỏi BGK. Hãy quay lại trang Báo cáo bảo vệ và bấm &quot;Tạo câu hỏi&quot;.
          </div>
        )}

        {/* LATEST EVALUATION PANEL */}
        {latestEvaluation && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Nhận xét & Đánh giá từ Ban Giám Khảo</h3>
              <span className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                latestEvaluation.assessment === "STRONG"
                  ? "bg-emerald-100 text-emerald-800"
                  : latestEvaluation.assessment === "ADEQUATE"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {latestEvaluation.assessment}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-emerald-800 block mb-1">✓ Điểm tốt:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {latestEvaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <span className="font-bold text-amber-800 block mb-1">⚠️ Cần cải thiện:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {latestEvaluation.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                </ul>
              </div>
            </div>

            {latestEvaluation.unsupportedClaims && latestEvaluation.unsupportedClaims.length > 0 && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                <strong>Cảnh báo số liệu chưa xác minh:</strong> {latestEvaluation.unsupportedClaims.join("; ")}
              </div>
            )}

            {latestEvaluation.followUpQuestion && (
              <div className="rounded-xl bg-indigo-50/60 p-3 text-xs text-indigo-900 border border-indigo-100">
                <strong>Câu hỏi đào sâu tiếp theo:</strong> {latestEvaluation.followUpQuestion}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Chuyển câu hỏi tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* PRACTICE TURNS HISTORY */}
        {turns.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Lịch sử các câu đã luyện tập ({turns.length} câu)
            </h3>
            <div className="space-y-3">
              {turns.map((t, idx) => (
                <div key={t.id || idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1">
                  <p><strong>BGK:</strong> {t.questionText}</p>
                  <p className="text-slate-600 font-serif"><strong>Thầy/Cô:</strong> {t.answerText}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">Đánh giá: {t.evaluationJson?.assessment}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
