"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DocumentType } from "@/types/project";

export default function CreateProjectWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    documentType: "" as DocumentType | "",
    workingTitle: "",
    educationLevel: "SECONDARY",
    subjectGroup: "MATH",
    gradeLevel: "Lớp 8",
    schoolYear: "2026-2027",
    schoolName: "",
    problemStatement: "",
    targetGroup: "",
    initialGoal: "",
  });

  const handleSelectDocType = (type: DocumentType) => {
    setFormData({ ...formData, documentType: type });
  };

  const handleCreate = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const requestId = `req_create_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requestId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.message || "Tạo dự án thất bại.");
      } else {
        router.push(data.data?.next || `/projects/${data.data?.project?.id}`);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Khởi tạo dự án • Bước {step}/4
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              {step === 1 && "Chọn loại tài liệu"}
              {step === 2 && "Thông tin chuyên môn & bối cảnh"}
              {step === 3 && "Vấn đề thực tế & mục tiêu"}
              {step === 4 && "Xác nhận và tạo dự án"}
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Hủy & Quay lại
          </Link>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-4 text-xs text-red-700 border border-red-200" role="alert">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Select Document Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Thầy/Cô vui lòng lựa chọn loại hình tài liệu cần xây dựng:
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() => handleSelectDocType("SKKN")}
                className={`cursor-pointer rounded-2xl border p-6 transition shadow-sm ${
                  formData.documentType === "SKKN"
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  SK
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Sáng kiến kinh nghiệm</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Dành cho các biện pháp sư phạm, đổi mới phương pháp dạy học, kiểm tra đánh giá hoặc quản lý giáo dục có minh chứng số liệu thực tế.
                </p>
              </div>

              <div
                onClick={() => handleSelectDocType("SOLUTION")}
                className={`cursor-pointer rounded-2xl border p-6 transition shadow-sm ${
                  formData.documentType === "SOLUTION"
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  GP
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Giải pháp hữu ích</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Dành cho các giải pháp thực tiễn cần nhấn mạnh tính mới, tính hiệu quả, khả năng áp dụng và chuẩn bị thuyết trình trước Ban giám khảo.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={!formData.documentType}
                onClick={() => setStep(2)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40 transition"
              >
                Tiếp tục: Nhập thông tin →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Basic & Pedagogical Info */}
        {step === 2 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label htmlFor="workingTitle" className="block text-xs font-semibold text-slate-700">
                Tên dự án tạm thời (Tùy chọn)
              </label>
              <input
                id="workingTitle"
                type="text"
                placeholder="Ví dụ: Nâng cao kỹ năng giải toán thực tế cho học sinh lớp 8"
                value={formData.workingTitle}
                onChange={(e) => setFormData({ ...formData, workingTitle: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                * Tên chính thức sẽ được trợ lý AI hỗ trợ phân tích và chốt ở Bước 1.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="educationLevel" className="block text-xs font-semibold text-slate-700">
                  Cấp học *
                </label>
                <select
                  id="educationLevel"
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white shadow-sm focus:border-blue-500"
                >
                  <option value="PRE_SCHOOL">Mầm non</option>
                  <option value="PRIMARY">Tiểu học</option>
                  <option value="SECONDARY">THCS</option>
                  <option value="HIGH_SCHOOL">THPT</option>
                  <option value="VOCATIONAL">GDTX / GDNN</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label htmlFor="subjectGroup" className="block text-xs font-semibold text-slate-700">
                  Môn / Lĩnh vực chuyên môn *
                </label>
                <select
                  id="subjectGroup"
                  value={formData.subjectGroup}
                  onChange={(e) => setFormData({ ...formData, subjectGroup: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white shadow-sm focus:border-blue-500"
                >
                  <option value="MATH">Toán học</option>
                  <option value="LITERATURE">Ngữ văn</option>
                  <option value="FOREIGN_LANGUAGES">Tiếng Anh / Ngoại ngữ</option>
                  <option value="NATURAL_SCIENCES">Khoa học tự nhiên (Lý, Hóa, Sinh)</option>
                  <option value="SOCIAL_SCIENCES">Lịch sử & Địa lí / KHXH</option>
                  <option value="INFORMATICS_TECHNOLOGY">Tin học & Công nghệ</option>
                  <option value="PRIMARY_GENERAL">Tiểu học (Tổng hợp)</option>
                  <option value="PRE_SCHOOL">Giáo dục Mầm non</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="gradeLevel" className="block text-xs font-semibold text-slate-700">
                  Khối / Lớp áp dụng
                </label>
                <input
                  id="gradeLevel"
                  type="text"
                  placeholder="Ví dụ: Khối 8, Lớp 8A1"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="schoolYear" className="block text-xs font-semibold text-slate-700">
                  Năm học thực hiện *
                </label>
                <select
                  id="schoolYear"
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white shadow-sm"
                >
                  <option value="2025-2026">2025–2026</option>
                  <option value="2026-2027">2026–2027</option>
                  <option value="2027-2028">2027–2028</option>
                </select>
              </div>

              <div>
                <label htmlFor="schoolName" className="block text-xs font-semibold text-slate-700">
                  Trường / Đơn vị công tác
                </label>
                <input
                  id="schoolName"
                  type="text"
                  placeholder="THCS Chu Văn An"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Tiếp tục: Vấn đề thực tế →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Problem Statement & Goals */}
        {step === 3 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label htmlFor="problemStatement" className="block text-xs font-semibold text-slate-700">
                Vấn đề thực tế Thầy/Cô muốn giải quyết là gì?
              </label>
              <textarea
                id="problemStatement"
                rows={4}
                placeholder="Ví dụ: Học sinh còn thụ động trong việc tự học, chưa biết liên hệ kiến thức vào bài toán thực tiễn cuộc sống..."
                value={formData.problemStatement}
                onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="targetGroup" className="block text-xs font-semibold text-slate-700">
                Đối tượng dự kiến áp dụng biện pháp
              </label>
              <input
                id="targetGroup"
                type="text"
                placeholder="Ví dụ: Học sinh lớp 8A và 8B trường THCS..."
                value={formData.targetGroup}
                onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="initialGoal" className="block text-xs font-semibold text-slate-700">
                Mục tiêu Thầy/Cô mong muốn cải thiện
              </label>
              <textarea
                id="initialGoal"
                rows={3}
                placeholder="Ví dụ: Giúp 100% học sinh nắm vững phương pháp và tăng tỷ lệ học sinh hứng thú học tập..."
                value={formData.initialGoal}
                onChange={(e) => setFormData({ ...formData, initialGoal: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Xem lại & Xác nhận →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Summary & Confirm */}
        {step === 4 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Xác nhận thông tin dự án</h2>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Loại tài liệu:</span>
                <strong className="text-slate-900">{formData.documentType === "SKKN" ? "Sáng kiến kinh nghiệm" : "Giải pháp hữu ích"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tên tạm thời:</span>
                <strong className="text-slate-900">{formData.workingTitle || "(Chưa đặt tên)"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cấp học:</span>
                <strong className="text-slate-900">{formData.educationLevel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chuyên môn:</span>
                <strong className="text-slate-900">{formData.subjectGroup}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Năm học:</span>
                <strong className="text-slate-900">{formData.schoolYear}</strong>
              </div>
              {formData.problemStatement && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block">Vấn đề thực tế:</span>
                  <p className="text-slate-800 mt-1 italic">{formData.problemStatement}</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Chỉnh sửa
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCreate}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
              >
                {loading ? "Đang khởi tạo dự án..." : "Tạo dự án & Bắt đầu"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
