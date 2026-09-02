import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 space-y-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-sm">
            ⚡
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">SKKN AI Ops</h2>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Console Quản Trị
            </span>
          </div>
        </div>

        <nav className="space-y-1 text-xs font-semibold">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            📊 Tổng quan (Dashboard)
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            👥 Người dùng & Trial
          </Link>
          <Link
            href="/admin/licenses"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            🔑 Giấy phép & Thiết bị
          </Link>
          <Link
            href="/admin/ai-cost"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            🤖 AI Cost & Tokens
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            📋 Nhật ký Vận hành
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="block text-center text-xs font-semibold text-slate-400 hover:text-white py-2 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          >
            ← Về Ứng dụng Giáo viên
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
