# Hướng dẫn Cài đặt Supabase cho SKKN AI

## Bước 1 – Tạo tài khoản Supabase miễn phí

1. Truy cập: **https://supabase.com/dashboard/sign-up**
2. Đăng ký bằng Email hoặc GitHub
3. Xác nhận email kích hoạt tài khoản

---

## Bước 2 – Tạo Project mới

1. Nhấn nút **"New project"**
2. Chọn Organization (hoặc tạo mới)
3. Điền thông tin:
   - **Project name**: `skkn-ai` (hoặc tên tùy chọn)
   - **Database Password**: Tạo mật khẩu mạnh, lưu lại cẩn thận
   - **Region**: Chọn **Southeast Asia (Singapore)** — gần Việt Nam nhất
4. Nhấn **"Create new project"**
5. Chờ ~2 phút để hệ thống khởi tạo

---

## Bước 3 – Lấy API Keys

1. Vào **Project Settings** (biểu tượng bánh răng ⚙️ bên trái)
2. Chọn tab **API**
3. Sao chép 3 giá trị sau:

| Tên biến | Vị trí trong Supabase | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | `https://abcdef.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public | `eyJhbGci...` (chuỗi dài ~200 ký tự) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | `eyJhbGci...` (chuỗi dài ~200 ký tự, BÍ MẬT) |

> ⚠️ **KHÔNG chia sẻ `SUPABASE_SERVICE_ROLE_KEY` với bất kỳ ai.** Key này có toàn quyền trên database.

---

## Bước 4 – Cập nhật file .env.local

Mở file `.env.local` tại thư mục gốc dự án và điền vào:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Bước 5 – Khởi động lại máy chủ

```bash
# Dừng server cũ (Ctrl+C) rồi chạy lại:
npm run dev
```

---

## Bước 6 – Chạy Migrations (Tạo Database Schema)

Sau khi server hoạt động, chạy các file migration theo thứ tự trong Supabase SQL Editor:

1. Vào **Supabase Dashboard → SQL Editor**
2. Chạy lần lượt các file trong `supabase/migrations/` theo thứ tự số thứ tự:
   - `20260902000001_phase0_foundation_schema.sql`
   - `20260902000002_phase1_auth_trial_profile.sql`
   - ... (đến file cuối `20260902000013_phase11_admin_operations.sql`)
3. Sau đó chạy file seed: `supabase/seed/seed.sql`

---

## Kiểm tra kết nối thành công

Sau khi cấu hình xong, truy cập http://localhost:3000/register và thử đăng ký tài khoản. Nếu không còn thông báo lỗi màu vàng → kết nối Supabase thành công!

---

## Lấy AI API Keys (Tùy chọn)

| Provider | Đăng ký tại | Ghi chú |
|---|---|---|
| **OpenAI** | https://platform.openai.com/api-keys | Cần nạp credit, thường \$5–\$20 đủ dùng |
| **Google Gemini** | https://aistudio.google.com/app/apikey | Free tier 15 req/min |

Điền vào `.env.local`:
```env
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIza...
```