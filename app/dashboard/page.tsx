import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardService } from "@/server/services/dashboard-service";
import { STAGE_LABELS, STAGE_PROGRESS_MAP } from "@/types/project";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await DashboardService.getDashboardData(user.id);
  const { profile, projectSummary, recentProjects, subscription, usage } = data;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col justify-between border-r border-slate-200 bg-white p-5 lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              SK
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">SKKN AI</h2>
              <span className="text-[10px] text-slate-400">Sáng kiến kinh nghiệm</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg bg-blue-50 px-3 py-2 text-blue-700 font-bold"
            >
              <span>📊</span>
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              <span>📁</span>
              <span>Dự án của tôi</span>
            </Link>
            <Link
              href="/projects/new"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              <span>✨</span>
              <span>Tạo dự án mới</span>
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              <span>💳</span>
              <span>Gói cước & Quota</span>
            </Link>
            <Link
              href="/account/license"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              <span>🔑</span>
              <span>Bản quyền (License)</span>
            </Link>
            <Link
              href="/account/devices"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              <span>💻</span>
              <span>Thiết bị</span>
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              <span>👤</span>
              <span>Hồ sơ giáo viên</span>
            </Link>
          </nav>
        </div>

        {/* User Footer in Sidebar */}
        <div className="border-t border-slate-100 pt-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="font-bold text-slate-900 truncate">{profile.fullName}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
            <form action="/auth/callback" method="GET">
              <button
                type="submit"
                className="text-slate-400 hover:text-red-600 transition"
                title="Đăng xuất"
              >
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-slate-200 bg-white py-4 px-4 sm:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Xin chào, {profile.fullName}!
            </h1>
            <p className="text-xs text-slate-500">
              Hôm nay thầy/cô muốn tiếp tục sáng kiến hoặc giải pháp nào?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
            >
              + Tạo dự án mới
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Active Projects */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Dự án đang thực hiện</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{projectSummary.active}</span>
                <span className="text-xs text-blue-600 font-semibold">/ {usage.projects.limit} tối đa</span>
              </div>
            </div>

            {/* Card 2: Completed Projects */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Dự án hoàn thành</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">{projectSummary.completed}</span>
                <span className="text-xs text-slate-400">bài viết</span>
              </div>
            </div>

            {/* Card 3: Remaining AI Requests */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Lượt AI còn lại</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-blue-600">{usage.aiRequests.remaining}</span>
                <span className="text-xs text-slate-400">/ {usage.aiRequests.limit} lượt</span>
              </div>
            </div>

            {/* Card 4: Current Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Gói cước hiện tại</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900">{subscription.planName}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {subscription.isTrial ? subscription.remainingDays : "Đang hoạt động"}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Projects Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Dự án gần đây</h2>
              <Link href="/projects" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                Xem tất cả ({projectSummary.total}) →
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  📁
                </div>
                <h3 className="text-sm font-bold text-slate-900">Thầy/Cô chưa có dự án nào</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy tạo dự án đầu tiên để bắt đầu xây dựng Sáng kiến kinh nghiệm hoặc Giải pháp hữu ích chuẩn Bộ GD&ĐT.
                </p>
                <div className="pt-2">
                  <Link
                    href="/projects/new"
                    className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                  >
                    + Tạo dự án đầu tiên
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((p) => {
                  const progress = STAGE_PROGRESS_MAP[p.workflowStage] || 10;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50/50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.documentType === "SKKN"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {p.documentType === "SKKN" ? "SKKN" : "Giải pháp"}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {p.workingTitle || p.title || "Dự án mới"}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {p.subjectGroup} • {p.educationLevel} • Giai đoạn: {STAGE_LABELS[p.workflowStage]} ({progress}%)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/projects/${p.id}`}
                          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                        >
                          Tiếp tục →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
