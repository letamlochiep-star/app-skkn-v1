import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectService } from "@/server/services/project-service";
import {
  STAGE_LABELS,
  STAGE_PROGRESS_MAP,
  type WorkflowStage,
} from "@/types/project";

const WORKFLOW_STAGES: WorkflowStage[] = [
  "TOPIC",
  "DATA",
  "STRUCTURE",
  "WRITE",
  "REVIEW",
  "FINALIZE",
];

export default async function ProjectWorkspacePage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  let projectData;
  try {
    projectData = await ProjectService.getProject({
      projectId: params.projectId,
      userId: user.id,
    });
    // Touch last opened
    await ProjectService.touchLastOpened({
      projectId: params.projectId,
      userId: user.id,
    });
  } catch {
    notFound();
  }

  const { project, facts } = projectData;

  const getFactText = (key: string) => {
    const f = facts.find((r) => r.key === key);
    if (!f || !f.valueJson) return "(Chưa cung cấp)";
    if (typeof f.valueJson === "object" && "text" in (f.valueJson as Record<string, unknown>)) {
      return String((f.valueJson as Record<string, unknown>).text);
    }
    return String(f.valueJson);
  };

  const progress = STAGE_PROGRESS_MAP[project.workflowStage] || 10;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Workspace Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100 transition"
              title="Danh sách dự án"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    project.documentType === "SKKN"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {project.documentType === "SKKN" ? "SKKN" : "Giải pháp hữu ích"}
                </span>
                <h1 className="text-base font-bold text-slate-900">
                  {project.workingTitle || project.title || "Dự án mới"}
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                {project.subjectGroup} • {project.educationLevel} {project.gradeLevel ? `(${project.gradeLevel})` : ""} • Năm học {project.schoolYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}/settings`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cài đặt & Chỉnh sửa
            </Link>
            <Link
              href={`/projects/${project.id}/topic`}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
            >
              Bắt đầu Bước 1 →
            </Link>
          </div>
        </div>
      </header>

      {/* Stepper Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto gap-4 text-xs font-semibold">
            {WORKFLOW_STAGES.map((s, idx) => {
              const isCurrent = project.workflowStage === s;
              const isFirst = s === "TOPIC";

              return (
                <div
                  key={s}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-lg ${
                    isCurrent
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                      : isFirst
                      ? "text-slate-700 hover:bg-slate-50"
                      : "text-slate-400 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{STAGE_LABELS[s]}</span>
                  {!isFirst && <span className="text-[10px] font-normal text-slate-400">(Chưa mở)</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* CTA Card for Next Step */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Giai đoạn hiện tại: Bước 1
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Xác định và chốt tên đề tài
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Trợ lý AI sẽ phân tích vấn đề sư phạm thực tế của Thầy/Cô, kiểm tra tiêu chí GDPT 2018 và gợi ý các tên đề tài chuẩn thể thức.
              </p>
              <div className="mt-4">
                <Link
                  href={`/projects/${project.id}/topic`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                >
                  Mở màn hình Bước 1: Tên đề tài →
                </Link>
              </div>
            </div>

            {/* Pedagogical Facts Overview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Thông tin thực tế đã nhập</h3>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="font-semibold text-slate-500 block">Vấn đề thực tiễn cần giải quyết:</span>
                  <p className="mt-1 text-slate-900 leading-relaxed">{getFactText("problem_statement")}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="font-semibold text-slate-500 block">Đối tượng dự kiến áp dụng:</span>
                  <p className="mt-1 text-slate-900 leading-relaxed">{getFactText("target_group")}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="font-semibold text-slate-500 block">Mục tiêu ban đầu:</span>
                  <p className="mt-1 text-slate-900 leading-relaxed">{getFactText("initial_goal")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Context Column (1 col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Bối cảnh dự án</h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Loại tài liệu:</span>
                  <strong className="text-slate-900">{project.documentType === "SKKN" ? "Sáng kiến kinh nghiệm" : "Giải pháp hữu ích"}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Cấp học:</span>
                  <strong className="text-slate-900">{project.educationLevel}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Chuyên môn:</span>
                  <strong className="text-slate-900">{project.subjectGroup}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Năm học:</span>
                  <strong className="text-slate-900">{project.schoolYear}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Trường / Đơn vị:</span>
                  <strong className="text-slate-900">{project.schoolName || "(Chưa đặt)"}</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Tiến độ quy trình:</span>
                  <strong className="text-blue-600">{progress}%</strong>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/projects/${project.id}/settings`}
                  className="flex w-full justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Chỉnh sửa thông tin dự án
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
