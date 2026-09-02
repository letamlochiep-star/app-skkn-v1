# SKKN AI — PRODUCTION OPERATIONS RUNBOOK

Tài liệu hướng dẫn vận hành chuẩn (Standard Operating Procedures - SOP) cho hệ thống **SKKN AI – Sáng kiến kinh nghiệm & Giải pháp hữu ích**.

---

## 1. TỔNG QUAN KIẾN TRÚC & HẠ TẦNG
- **Frontend / API Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase PostgreSQL (Row Level Security enabled)
- **AI Infrastructure**: Multi-provider AI Router (OpenAI primary, Google Gemini fallback, Anthropic specialized)
- **Export Engine**: Deterministic Server-side OpenXML & PDF binary rendering
- **Security & RBAC**: Strict Server Guards (`requireAuth`, `requireEntitlement`, `requireLicense`, `requireAdminUser`)

---

## 2. QUY TRÌNH SAO LƯU & PHỤC HỒI (BACKUP & RESTORE)

### 2.1 Sao lưu tự động
- Cơ sở dữ liệu Supabase được sao lưu tự động hàng ngày (Point-in-Time Recovery - PITR).
- Các tệp xuất bản (Artifacts) được lưu trữ trên Object Storage có cấu hình versioning và immutable snapshot.

### 2.2 Quy trình phục hồi khi có sự cố
1. Xác định thời điểm dữ liệu toàn vẹn gần nhất từ bảng `system_audit_logs`.
2. Khôi phục cơ sở dữ liệu qua Supabase Dashboard / CLI PITR.
3. Chạy kiểm tra tính toàn vẹn (Integrity Check) bằng test suite:
   ```bash
   npm run test tests/e2e/full-lifecycle-e2e.test.ts
   ```

---

## 3. QUY TRÌNH XỬ LÝ SỰ CỐ NHÀ CUNG CẤP AI (AI OUTAGE & FALLBACK)

### 3.1 Nhận diện sự cố
- Tỷ lệ lỗi (Error Rate) tại `/admin/system` hoặc `/admin/ai-cost` tăng đột biến (> 2%).
- Log ghi nhận: `[AIRouter] Primary provider failed`.

### 3.2 Tự động chuyển đổi dự phòng
- AI Router tự động kích hoạt Provider phụ (Google Gemini) mà không gián đoạn thao tác của giáo viên.
- Giáo viên không nhận thấy lỗi, tiến trình soạn thảo được bảo toàn 100%.

---

## 4. QUY TRÌNH QUẢN TRỊ BẢN QUYỀN & THIẾT BỊ KHẨN CẤP

### 4.1 Thu hồi License vi phạm
1. Truy cập `/admin/licenses`.
2. Tìm mã License hoặc email người dùng.
3. Bấm `[ Thu hồi ]` -> Xác nhận lý do thu hồi.
4. Hệ thống tự động vô hiệu hóa toàn bộ thiết bị đang liên kết.

### 4.2 Hủy kích hoạt thiết bị từ xa (Hỗ trợ giáo viên đổi máy)
1. Truy cập `/admin/licenses`.
2. Tại bảng "Thiết Bị Đang Kích Hoạt", chọn thiết bị cần xóa.
3. Bấm `[ Hủy kích hoạt ]`.

---

## 5. BẢNG KIỂM TRA SỨC KHỎE ĐỊNH KỲ (HEALTH CHECKLIST)
| Thành phần | Endpoint kiểm tra | Tiêu chuẩn đạt |
| :--- | :--- | :--- |
| Core Web App | `GET /api/health` | HTTP 200 `{"status":"ok"}` |
| AI Providers | `GET /api/health/ai` | HTTP 200 `{"providers":...}` |
| Admin Ops Console | `GET /api/admin/system` | `appStatus: HEALTHY`, `databaseStatus: CONNECTED` |
| Export Engine | `/projects/[id]/export` | Sinh tệp < 2s, SHA-256 Checksum hợp lệ |
