import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/server/services/subscription-service";
import { UsageService } from "@/server/services/usage-service";

export default async function AccountPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "anonymous-user";
  const plan = await SubscriptionService.getCurrentPlan(userId);
  const subStatus = await SubscriptionService.getSubscriptionStatus(userId);
  const usage = await UsageService.getUsageSummary(userId);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Tài khoản & Gói Dịch vụ</h1>
            <p className="text-xs text-slate-500">Xem hạn mức sử dụng và thông tin bản quyền</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Về Bảng điều khiển
          </Link>
        </div>

        {/* Plan Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Gói hiện tại
              </span>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{plan.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  subStatus.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {subStatus.isActive ? "Đang hoạt động" : "Hết hạn"}
              </span>

              <Link
                href="/plans"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
              >
                Nâng cấp gói
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Thời gian bắt đầu:</span>{" "}
              <strong>{subStatus.trialStatus.startedAt ? new Date(subStatus.trialStatus.startedAt).toLocaleDateString("vi-VN") : "Hôm nay"}</strong>
            </div>
            <div>
              <span className="text-slate-400">Thời gian hết hạn:</span>{" "}
              <strong>{subStatus.trialStatus.expiresAt ? new Date(subStatus.trialStatus.expiresAt).toLocaleDateString("vi-VN") : "3 ngày"}</strong>
            </div>
          </div>
        </div>

        {/* Quotas Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Hạn mức tài nguyên (Quotas)</h3>

          <div className="mt-6 space-y-5">
            {/* Projects Quota */}
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">Số lượng Đề tài SKKN</span>
                <span className="text-slate-900 font-bold">
                  {usage.projects.used} / {usage.projects.limit} đề tài (Còn {usage.projects.remaining})
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(100, (usage.projects.used / Math.max(1, usage.projects.limit)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* AI Requests Quota */}
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">Lượt AI Requests</span>
                <span className="text-slate-900 font-bold">
                  {usage.aiRequests.used} / {usage.aiRequests.limit} lượt (Còn {usage.aiRequests.remaining})
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(100, (usage.aiRequests.used / Math.max(1, usage.aiRequests.limit)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* AI Tokens Quota */}
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">Hạn mức AI Tokens</span>
                <span className="text-slate-900 font-bold">
                  {usage.aiTokens.used.toLocaleString()} / {usage.aiTokens.limit.toLocaleString()} tokens
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{
                    width: `${Math.min(100, (usage.aiTokens.used / Math.max(1, usage.aiTokens.limit)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Storage Quota */}
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">Dung lượng lưu trữ tài liệu</span>
                <span className="text-slate-900 font-bold">
                  {usage.storageMb.used} MB / {usage.storageMb.limit} MB
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-600 transition-all"
                  style={{
                    width: `${Math.min(100, (usage.storageMb.used / Math.max(1, usage.storageMb.limit)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
