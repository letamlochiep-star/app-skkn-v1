import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Presentation,
  Download,
  Users,
  ArrowRight,
  Zap,
  BarChart3,
  Award,
  Layers,
  Settings
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* -------------------- HEADER / NAVBAR -------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-2">
                SKKN AI <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">v1.0</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Sáng kiến kinh nghiệm & Giải pháp hữu ích</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Tính năng</a>
            <Link href="/plans" className="hover:text-blue-600 transition">Bảng giá & Gói cước</Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition">Bảng điều khiển</Link>
            <Link href="/admin" className="hover:text-blue-600 transition flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Cổng Quản trị
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-sm"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Zap className="h-4 w-4" />
              <span>Dùng thử 3 ngày</span>
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),theme(colors.slate.50))]" />
        
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm mb-6">
            <Award className="h-4 w-4 text-blue-600" />
            <span>Chuẩn cấu trúc Chương trình GDPT 2018 & Thông tư Bộ GD&ĐT</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-tight">
            Trợ lý AI Đắc lực Xây dựng <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              Sáng Kiến Kinh Nghiệm & Báo Cáo Giải Pháp
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-600 leading-relaxed">
            Quy trình sư phạm 6 bước chặt chẽ: Phân tích đề tài, thu thập số liệu thực tế, soạn thảo 18 phần bất biến, chấm điểm rubric giám khảo, chuẩn bị slide thuyết trình bảo vệ và xuất bản file DOCX/PDF/PPTX chuẩn thể thức.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:shadow-blue-600/35 transition flex items-center gap-2"
            >
              <span>Đăng ký & Bắt đầu Dùng thử Miễn phí</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
            >
              Đăng nhập Giáo viên
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-6 py-3.5 text-base font-semibold text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-2"
            >
              <Layers className="h-5 w-5" />
              <span>Vào Bảng điều khiển (Dashboard)</span>
            </Link>
          </div>

          {/* Key Metrics */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-slate-200/80 pt-8 text-left">
            <div className="rounded-xl bg-white/70 p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-blue-600">18 Bước</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Cấu trúc Prompt chuẩn mực bất biến</div>
            </div>
            <div className="rounded-xl bg-white/70 p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-indigo-600">0 Token AI</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Xuất file DOCX / PDF / PPTX không tốn phí</div>
            </div>
            <div className="rounded-xl bg-white/70 p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-emerald-600">72 Giờ</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Dùng thử đầy đủ tính năng khi đăng ký</div>
            </div>
            <div className="rounded-xl bg-white/70 p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-purple-600">100% RLS</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Bảo mật đa tầng, dữ liệu giáo viên tuyệt mật</div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- QUICK ACCESS PORTAL CARDS -------------------- */}
      <section className="bg-white py-12 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Lối Tắt Truy Cập Nhanh Hệ Thống</h2>
            <p className="mt-2 text-sm text-slate-600">Chọn khu vực làm việc phù hợp với nhu cầu của Thầy/Cô</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Giáo viên & Dự án */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Khu vực Giáo viên</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Tạo đề tài SKKN mới, nhập số liệu sư phạm, viết bản thảo và thẩm định phản biện tự động.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/projects/new"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500 transition"
                >
                  Tạo Đề tài Mới
                </Link>
                <Link
                  href="/projects"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Danh sách Dự án của Tôi
                </Link>
              </div>
            </div>

            {/* Card 2: Bảng giá & License */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Gói Cước & Bản Quyền</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Xem bảng giá, nâng cấp gói cước tháng/năm, quản lý License Key và kích hoạt trên 2 thiết bị.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/plans"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Xem Bảng Giá & Nâng Cấp
                </Link>
                <Link
                  href="/account/license"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Quản lý Bản quyền & Thiết bị
                </Link>
              </div>
            </div>

            {/* Card 3: Admin & Vận hành */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white font-bold mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Khu vực Quản trị (Admin)</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Dành cho ban quản trị: Dashboard chỉ số, quản lý người dùng, gia hạn dùng thử, giám sát chi phí AI và audit log.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/admin"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Truy cập Admin Console
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Quản lý Người dùng & Gói
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 6-STEP WORKFLOW -------------------- */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Quy Trình Chuẩn Sư Phạm</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              6 Bước Hoàn Thiện Đề Tài Khoa Học & Chuẩn Mực
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Không sinh văn bản mơ hồ hay số liệu ảo. Hệ thống bảo vệ tính trung thực sư phạm với dữ liệu thực nghiệm của chính Thầy/Cô.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 transition">
              <div className="text-xs font-bold text-blue-600 mb-2">BƯỚC 1</div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Phân tích & Khóa Đề Tài
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Đánh giá tên đề tài theo 8 tiêu chuẩn Bộ GD&ĐT, gợi ý tối ưu và khóa tên đề tài tránh lạc đề.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 transition">
              <div className="text-xs font-bold text-blue-600 mb-2">BƯỚC 2</div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Thu thập Số liệu & Khóa Cấu trúc
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Nhập số liệu lớp thực nghiệm, đối chứng, khó khăn thực tế và khóa bộ 18 prompt chuyên biệt.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 transition">
              <div className="text-xs font-bold text-blue-600 mb-2">BƯỚC 3</div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                AI Soạn thảo & Versioning
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Soạn thảo từng phần chi tiết, so sánh lịch sử chỉnh sửa (Diff Viewer) và lắp ráp tài liệu toàn văn.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 transition">
              <div className="text-xs font-bold text-blue-600 mb-2">BƯỚC 4</div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                AI Thẩm định & Chấm Rubric
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Đóng vai Hội đồng chấm SKKN, kiểm toán tính nhất quán số liệu và đưa ra đúng 3 ưu tiên cải thiện.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 transition">
              <div className="text-xs font-bold text-blue-600 mb-2">BƯỚC 5</div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Presentation className="h-5 w-5 text-purple-600" />
                Báo cáo Bảo vệ Giải pháp
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Tạo trọn gói slide 16:9, kịch bản thuyết trình 5-10 phút, ngân hàng câu hỏi hội đồng và phòng tập dượt.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 transition">
              <div className="text-xs font-bold text-blue-600 mb-2">BƯỚC 6</div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Download className="h-5 w-5 text-rose-600" />
                Xuất bản 4 Định dạng (0 AI Cost)
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Xuất file DOCX chuẩn lề font, Full PDF in ấn, PPTX trình chiếu và PDF tóm tắt 1 trang chuẩn thể thức.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-bold text-slate-900">SKKN AI Platform</span>
            <span>—</span>
            <span>Đồng hành cùng Giáo viên Việt Nam</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-blue-600 transition">Đăng nhập</Link>
            <Link href="/register" className="hover:text-blue-600 transition">Đăng ký</Link>
            <Link href="/plans" className="hover:text-blue-600 transition">Bảng giá</Link>
            <Link href="/admin" className="hover:text-blue-600 transition">Quản trị</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}