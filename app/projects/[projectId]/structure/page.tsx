"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StructureSection, ProjectStructureRecord, StructureValidationResult } from "@/types/structure";
import type { ProjectRecord } from "@/types/project";

export default function ProjectStructurePage({
  params,
}: {
  params: { projectId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [structure, setStructure] = useState<ProjectStructureRecord | null>(null);
  const [sections, setSections] = useState<StructureSection[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // Status & loading
  const [proposing, setProposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [validationResult, setValidationResult] = useState<StructureValidationResult | null>(null);

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStructureState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStructureState = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/structure`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể tải cấu trúc đề tài.");
      } else {
        setProject(json.data.project);
        setStructure(json.data.structure);
        setIsLocked(json.data.isLocked);
        if (json.data.structure?.structureJson) {
          setSections(json.data.structure.structureJson);
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleProposeStructure = async () => {
    setProposing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const requestId = `req_struct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(`/api/projects/${params.projectId}/structure/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể đề xuất cấu trúc.");
      } else {
        setStructure(json.data);
        setSections(json.data.structureJson || []);
        setSuccessMsg("Đã đề xuất khung cấu trúc thành công!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi đề xuất cấu trúc");
    } finally {
      setProposing(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/structure`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Không thể lưu nháp cấu trúc.");
      } else {
        setStructure(json.data);
        setSuccessMsg("Đã lưu nháp cấu trúc thành công!");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi lưu cấu trúc");
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = () => {
    setErrorMsg(null);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (sections.length < 3) {
      errors.push("Khung cấu trúc cần có tối thiểu 3 phần chính.");
    }

    const allTitles = sections.map((s) => s.title.toLowerCase());
    const hasIntro = allTitles.some((t) => t.includes("đặt vấn đề") || t.includes("mở đầu") || t.includes("lý do"));
    const hasProblem = allTitles.some((t) => t.includes("thực trạng") || t.includes("cơ sở") || t.includes("hiện trạng"));
    const hasSolution = allTitles.some((t) => t.includes("biện pháp") || t.includes("giải pháp") || t.includes("nội dung"));
    const hasEffect = allTitles.some((t) => t.includes("kết quả") || t.includes("hiệu quả") || t.includes("thực nghiệm"));

    if (!hasIntro) warnings.push("Cấu trúc nên có phần Đặt vấn đề / Lý do chọn đề tài.");
    if (!hasSolution) errors.push("Cấu trúc bắt buộc phải có phần Biện pháp / Giải pháp.");
    if (!hasEffect) warnings.push("Cấu trúc nên có phần Đánh giá hiệu quả / Kết quả thực nghiệm.");

    setValidationResult({
      valid: errors.length === 0,
      errors,
      warnings,
      coverage: {
        topicCovered: hasIntro,
        problemCovered: hasProblem,
        solutionCovered: hasSolution,
        evidenceCovered: hasEffect,
        effectivenessCovered: hasEffect,
        referencesCovered: true,
      },
    });
  };

  const handleLockStructure = async () => {
    if (!confirmed || !structure) return;
    setLocking(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/structure/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: structure.id, confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Khóa cấu trúc thất bại.");
      } else {
        setIsLocked(true);
        setSuccessMsg("Đã chốt và khóa cấu trúc thành công!");
        router.push(`/projects/${params.projectId}/prompts`);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi khóa cấu trúc");
    } finally {
      setLocking(false);
    }
  };

  const handleUpdateSectionTitle = (index: number, newTitle: string) => {
    const updated = [...sections];
    updated[index].title = newTitle;
    setSections(updated);
  };

  const handleUpdateSectionPurpose = (index: number, newPurpose: string) => {
    const updated = [...sections];
    updated[index].purpose = newPurpose;
    setSections(updated);
  };

  const handleAddSection = () => {
    const newSec: StructureSection = {
      id: `sec_${Date.now()}`,
      order: sections.length + 1,
      title: "Mục mới bổ sung",
      purpose: "Mô tả mục đích của phần này...",
      required: false,
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (index: number) => {
    const target = sections[index];
    if (target.required && !confirm("Mục này được đánh dấu bắt buộc. Thầy/Cô có chắc chắn muốn xóa không?")) {
      return;
    }
    const updated = sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
    setSections(updated);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải khung cấu trúc...</div>;
  }

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
              Khung Cấu trúc Đề tài
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đề tài: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.projectId}/data`}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về Dữ liệu thực tế
            </Link>
            {isLocked && (
              <Link
                href={`/projects/${params.projectId}/prompts`}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition"
              >
                Sang Bộ 18 Câu lệnh →
              </Link>
            )}
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

        {/* LOCKED BANNER */}
        {isLocked && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                🔒
              </span>
              <h2 className="text-base font-bold text-emerald-900">Khung Cấu trúc đã được Khóa</h2>
            </div>
            <p className="text-xs text-emerald-800">
              Cấu trúc đã được chốt an toàn và sẵn sàng để tạo bộ 18 câu lệnh hoàn chỉnh.
            </p>
          </div>
        )}

        {/* STRUCTURE ACTION BAR */}
        {!isLocked && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Đề xuất hoặc Tùy chỉnh Cấu trúc</h3>
              <p className="text-xs text-slate-500">
                Sử dụng AI để đề xuất khung cấu trúc bám sát GDPT 2018 và thể loại đề tài.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={proposing}
                onClick={handleProposeStructure}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {proposing ? "Đang đề xuất..." : "Đề xuất Cấu trúc AI"}
              </button>
              {sections.length > 0 && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveDraft}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    {saving ? "Đang lưu..." : "Lưu nháp"}
                  </button>
                  <button
                    type="button"
                    onClick={handleValidate}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                  >
                    Kiểm tra cấu trúc
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* VALIDATION RESULTS IF CHECKED */}
        {validationResult && (
          <div
            className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
              validationResult.valid ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
            }`}
          >
            <h4 className="text-xs font-bold text-slate-900">
              Kết quả kiểm tra tính bao phủ (Coverage Validation):
            </h4>
            {validationResult.errors.length > 0 && (
              <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                {validationResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {validationResult.warnings.length > 0 && (
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                {validationResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            {validationResult.valid && (
              <p className="text-xs text-emerald-800 font-semibold">
                ✓ Khung cấu trúc hoàn toàn hợp lệ và đáp ứng đầy đủ các tiêu chí trọng tâm!
              </p>
            )}
          </div>
        )}

        {/* STRUCTURE SECTIONS EDITOR */}
        {sections.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Danh sách các phần trong Khung Cấu trúc ({sections.length} phần)
              </h3>
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  + Thêm phần mới
                </button>
              )}
            </div>

            <div className="space-y-4">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                      Phần {sec.order}
                    </span>
                    <div className="flex items-center gap-2">
                      {sec.required && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Bắt buộc
                        </span>
                      )}
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Tiêu đề phần:</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={sec.title}
                      onChange={(e) => handleUpdateSectionTitle(idx, e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Mục đích & Yêu cầu nội dung:</label>
                    <textarea
                      rows={2}
                      disabled={isLocked}
                      value={sec.purpose}
                      onChange={(e) => handleUpdateSectionPurpose(idx, e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOCK CONFIRMATION BOX */}
        {sections.length > 0 && !isLocked && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xác nhận và Khóa Cấu trúc</h3>
            <p className="text-xs text-slate-500">
              Sau khi chốt và khóa cấu trúc, hệ thống sẽ chuyển sang tạo Bộ đúng 18 câu lệnh (18 Prompts) dựa trên khung cấu trúc này.
            </p>

            <div className="flex items-start gap-2 pt-2">
              <input
                id="structureConfirmCheck"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="structureConfirmCheck" className="text-xs text-slate-700">
                Tôi đã kiểm tra và xác nhận khung cấu trúc này sẽ được dùng để xây dựng nội dung đề tài.
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={locking || !confirmed || sections.length < 3}
                onClick={handleLockStructure}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
              >
                {locking ? "Đang khóa cấu trúc..." : "Chốt Cấu trúc (Sang Bộ 18 Câu lệnh) →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
