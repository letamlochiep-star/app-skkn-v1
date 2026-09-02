import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Phase 0: Foundation & Guardrails
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          SKKN AI Platform
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Nền tảng trợ lý thông minh hỗ trợ giáo viên xây dựng và hoàn thiện Sáng kiến kinh nghiệm,
          Giải pháp hữu ích chuẩn Chương trình GDPT 2018.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/api/health"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Kiểm tra Hệ thống (Health Check)
          </Link>
          <Link
            href="/api/health/ai"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Kiểm tra AI Provider
          </Link>
        </div>
      </div>
    </main>
  );
}
