"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  ExportType,
  ExportMode,
  ExportReadiness,
  ProjectExportJobRecord,
  ProjectExportArtifactRecord,
  ProjectExportDownloadRecord,
} from "@/types/export";
import type { ProjectRecord } from "@/types/project";

export default function ProjectExportPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [mode, setMode] = useState<ExportMode>("FINAL");
  const [readiness, setReadiness] = useState<Record<ExportType, ExportReadiness> | null>(null);
  const [jobs, setJobs] = useState<ProjectExportJobRecord[]>([]);
  const [artifacts, setArtifacts] = useState<ProjectExportArtifactRecord[]>([]);
  const [downloads, setDownloads] = useState<ProjectExportDownloadRecord[]>([]);

  // Generation loading states
  const [generatingType, setGeneratingType] = useState<ExportType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchExportState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const fetchExportState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/exports`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải thông tin xuất bản");
      } else {
        setProject(json.data.project);
        setReadiness(json.data.readiness);
        setJobs(json.data.jobs || []);
        setArtifacts(json.data.artifacts || []);
        setDownloads(json.data.downloads || []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExport = async (type: ExportType) => {
    setGeneratingType(type);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_exp_${type}_${Date.now()}`;
      const res = await fetch(`/api/projects/${params.projectId}/exports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: type, mode, requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || `Xuất ${type} thất bại`);
      } else {
        setSuccessMsg(`Đã tạo tệp ${type} thành công! Thầy/Cô có thể tải xuống ngay.`);
        fetchExportState();
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setGeneratingType(null);
    }
  };

  if (loading && !project) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang chuẩn bị Trung tâm Xuất bản Tài liệu...</div>;
  }

  const exportCards: {
    type: ExportType;
    title: string;
    description: string;
    icon: string;
    supported: boolean;
  }[] = [
    {
      type: "DOCX",
      title: "Bản Toàn văn Word (.DOCX)",
      description: "Định dạng A4 chuẩn Bộ GD&ĐT, Times New Roman 14pt, lề 2-2-3-1.5cm, trang bìa, bảng biểu và phụ lục.",
      icon: "📄",
      supported: true,
    },
    {
      type: "FULL_PDF",
      title: "Bản Toàn văn PDF (.PDF)",
      description: "File PDF chất lượng cao, định dạng đồng bộ, tối ưu cho in ấn và nộp trực tuyến.",
      icon: "📑",
      supported: true,
    },
    {
      type: "DEFENSE_PPTX",
      title: "Báo cáo Bảo vệ (.PPTX)",
      description: "Slide trình chiếu thuyết trình trước Ban Giám Khảo (16:9), kèm Ghi chú diễn giả (Speaker Notes).",
      icon: "📊",
      supported: project?.documentType === "SOLUTION",
    },
    {
      type: "ONE_PAGE_PDF",
      title: "Tóm tắt 1 Trang (.PDF)",
      description: "Bản tóm tắt giải pháp cô đọng trong đúng 1 trang A4 dành riêng cho Hội đồng chấm.",
      icon: "📋",
      supported: project?.documentType === "SOLUTION",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Trung tâm Xuất bản & Tải về
              </span>
              <span className="text-xs text-slate-500">
                Loại: <strong>{project?.documentType === "SOLUTION" ? "Giải pháp Hữu ích" : "Sáng kiến Kinh nghiệm"}</strong>
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Xuất Bản Hồ Sơ & Báo Cáo Hoàn Chỉnh
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {project?.documentType === "SOLUTION" && (
              <Link
                href={`/projects/${params.projectId}/defense`}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                ← Về Báo cáo Bảo vệ
              </Link>
            )}
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

        {/* MODE TOGGLE CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Chế độ Xuất bản</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "FINAL"
                ? "Bản chính thức (FINAL): Yêu cầu hoàn thiện 100% dữ liệu, không còn placeholder và đã qua rà soát."
                : "Bản nháp (DRAFT): Cho phép xuất tài liệu đang hoàn thiện với nhãn BẢN NHÁP để xem trước."}
            </p>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setMode("FINAL")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                mode === "FINAL" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bản Chính thức (Final)
            </button>
            <button
              type="button"
              onClick={() => setMode("DRAFT")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                mode === "DRAFT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bản Nháp (Draft)
            </button>
          </div>
        </div>

        {/* 4 PRODUCT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exportCards.map((card) => {
            const rd = readiness ? readiness[card.type] : null;
            const isGenerating = generatingType === card.type;
            const latestArtifact = artifacts.find((a) => a.artifactType === card.type);

            return (
              <div
                key={card.type}
                className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition ${
                  !card.supported
                    ? "border-slate-200 bg-slate-50/50 opacity-60"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{card.icon}</span>
                    {card.supported && rd && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          rd.status === "READY"
                            ? "bg-emerald-100 text-emerald-800"
                            : rd.status === "READY_WITH_WARNINGS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rd.status === "READY"
                          ? "SẴN SÀNG"
                          : rd.status === "READY_WITH_WARNINGS"
                          ? "CÓ CẢNH BÁO"
                          : "CHƯA SẴN SÀNG"}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                  </div>

                  {!card.supported && (
                    <p className="text-[11px] text-slate-400 italic">
                      * Chỉ áp dụng cho đề tài Giải pháp hữu ích.
                    </p>
                  )}

                  {card.supported && rd && rd.blockers.length > 0 && (
                    <div className="rounded-lg bg-red-50 p-2.5 text-[11px] text-red-700 border border-red-100 space-y-1">
                      <strong className="block">Yêu cầu cần xử lý trước khi xuất:</strong>
                      <ul className="list-disc list-inside">
                        {rd.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.supported && rd && rd.warnings.length > 0 && (
                    <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-100 space-y-1">
                      <strong className="block">Lưu ý:</strong>
                      <ul className="list-disc list-inside">
                        {rd.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={!card.supported || isGenerating || (mode === "FINAL" && rd?.status === "BLOCKED")}
                    onClick={() => handleGenerateExport(card.type)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 transition"
                  >
                    {isGenerating ? "Đang tạo file..." : "Tạo tệp xuất bản"}
                  </button>

                  {latestArtifact && (
                    <a
                      href={`/api/projects/${params.projectId}/exports/artifacts/${latestArtifact.id}/download`}
                      download={latestArtifact.filename}
                      className="rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      Tải xuống (v{latestArtifact.version}) ↓
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* EXPORT HISTORY TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lịch Sử Xuất File ({artifacts.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bản xuất bản được lưu trữ bất biến và bảo vệ toàn vẹn bằng mã băm SHA-256.
              </p>
            </div>
          </div>

          {artifacts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Chưa có tệp nào được xuất. Hãy bấm &quot;Tạo tệp xuất bản&quot; ở các thẻ phía trên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-slate-700 divide-y divide-slate-200">
                <thead>
                  <tr className="text-left font-bold text-slate-500">
                    <th className="py-2.5 px-3">Loại tệp</th>
                    <th className="py-2.5 px-3">Tên tệp</th>
                    <th className="py-2.5 px-3">Dung lượng</th>
                    <th className="py-2.5 px-3">Thời gian tạo</th>
                    <th className="py-2.5 px-3">Mã băm SHA-256</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {artifacts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{a.artifactType}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{a.filename}</td>
                      <td className="py-2.5 px-3 text-slate-500">{(a.sizeBytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(a.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{a.checksum.substring(0, 10)}...</td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={`/api/projects/${params.projectId}/exports/artifacts/${a.id}/download`}
                          download={a.filename}
                          className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-200 transition"
                        >
                          Tải lại ↓
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
