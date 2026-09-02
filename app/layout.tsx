import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKKN AI — Trợ lý viết Sáng kiến kinh nghiệm",
  description: "Hệ thống hỗ trợ giáo viên xây dựng SKKN & Giải pháp hữu ích chuẩn Bộ GD&ĐT GDPT 2018",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
