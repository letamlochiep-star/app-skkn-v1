import Link from "next/link";
import { DEFAULT_PLANS } from "@/server/services/subscription-service";

export default function PlansPage() {
  const plans = [
    {
      ...DEFAULT_PLANS.TRIAL,
      price: "Miễn phí",
      subtitle: "3 ngày trải nghiệm",
      popular: false,
      ctaText: "Đang sử dụng",
      ctaHref: "/dashboard",
    },
    {
      ...DEFAULT_PLANS.PERSONAL_MONTHLY,
      price: "199.000 đ",
      subtitle: "tháng cao điểm",
      popular: true,
      ctaText: "Đăng ký gói 1 tháng",
      ctaHref: "/account/upgrade?plan=PERSONAL_MONTHLY",
    },
    {
      ...DEFAULT_PLANS.PERSONAL_YEARLY,
      price: "990.000 đ",
      subtitle: "trọn vẹn năm học",
      popular: false,
      ctaText: "Đăng ký gói 1 năm",
      ctaHref: "/account/upgrade?plan=PERSONAL_YEARLY",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Bảng gói dịch vụ SKKN AI
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500 sm:text-lg">
            Lựa chọn gói phù hợp với nhu cầu viết Sáng kiến kinh nghiệm và Giải pháp hữu ích của Thầy/Cô
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.code}
              className={`relative flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm transition border ${
                p.popular ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-200"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 right-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  Phổ biến nhất
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-slate-900">{p.name}</h2>
                <p className="mt-2 text-xs text-slate-500 min-h-[32px]">{p.description}</p>

                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900">{p.price}</span>
                  <span className="ml-1.5 text-xs text-slate-500">/ {p.subtitle}</span>
                </div>

                <ul className="mt-8 space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Số lượng đề tài: <strong>{p.maxProjects} đề tài</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Lượt AI request: <strong>{p.maxAiRequests} lượt</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Hạn mức Token: <strong>{p.maxAiTokens.toLocaleString()} tokens</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>Dung lượng lưu trữ: <strong>{p.maxStorageMb} MB</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={p.canExportDocx ? "text-blue-600 font-bold" : "text-slate-300"}>
                      {p.canExportDocx ? "✓" : "✕"}
                    </span>
                    <span className={p.canExportDocx ? "" : "text-slate-400"}>
                      Xuất văn bản Word (.docx)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={p.canExportPdf ? "text-blue-600 font-bold" : "text-slate-300"}>
                      {p.canExportPdf ? "✓" : "✕"}
                    </span>
                    <span className={p.canExportPdf ? "" : "text-slate-400"}>
                      Xuất bản PDF chuẩn thể thức
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={p.canUseDefensePresentation ? "text-blue-600 font-bold" : "text-slate-300"}>
                      {p.canUseDefensePresentation ? "✓" : "✕"}
                    </span>
                    <span className={p.canUseDefensePresentation ? "" : "text-slate-400"}>
                      Soạn slide & kịch bản bảo vệ trước BGK
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href={p.ctaHref}
                  className={`flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                    p.popular
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {p.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            ← Quay lại Bảng điều khiển
          </Link>
        </div>
      </div>
    </div>
  );
}
