# MASTER PRD — SKKN AI v1.0
## HỆ THỐNG TRỢ LÝ THÔNG MINH VIẾT SÁNG KIẾN KINH NGHIỆM & GIẢI PHÁP HỮU ÍCH

### 1. TỔNG QUAN HỆ THỐNG
SKKN AI là nền tảng webapp hỗ trợ giáo viên các cấp (Mầm non, Tiểu học, THCS, THPT, GDTX, CĐ/ĐH) xây dựng, phát triển và hoàn thiện Sáng kiến kinh nghiệm (SKKN) và Giải pháp hữu ích chuẩn Bộ GD&ĐT (chương trình GDPT 2018).

### 2. MỤC TIÊU VÀ NGUYÊN TẮC CỐT LÕI
- **Tính sư phạm chuẩn mực**: Phù hợp định hướng phát triển phẩm chất, năng lực học sinh theo GDPT 2018.
- **Tính thực chứng (Evidence-based)**: Không bịa đặt số liệu, có bảng biểu đối chứng trước/sau tác động, minh chứng cụ thể.
- **Bảo vệ quyền tác giả & Độc quyền**: Chống đạo văn, đa dạng hóa giải pháp, mỗi sản phẩm mang phong cách cá nhân hóa của giáo viên.
- **Guardrails nghiêm ngặt**: Kiến trúc AI Provider Abstraction kết hợp Schema Validation, bảo mật API keys ở backend và kiểm soát RLS dữ liệu người dùng.

### 3. CÁC GIAI ĐOẠN PHÁT TRIỂN
- **Phase 0 (Hiện tại)**: Nền tảng kỹ thuật, Database foundation, RLS, AI Provider Abstraction, AI Router, Skill Loader, Knowledge Module Selector, JSON Schema Registry & Validator, Health endpoints, Unit tests.
- **Phase 1**: Thu thập dữ liệu thông minh (Smart Data Questionnaire), phân tích hồ sơ sư phạm.
- **Phase 2**: AI Ideation, dàn ý chi tiết và lập kế hoạch thực nghiệm.
- **Phase 3**: Soạn thảo từng phần có kiểm soát chất lượng (Section Writer).
- **Phase 4**: Đánh giá đa chiều (AI Reviewer), đối chiếu tiêu chí Hội đồng chấm SKKN.
- **Phase 5**: Hoàn thiện định dạng, xuất bản (Export Word/PDF theo chuẩn thể thức văn bản).

### 4. KIẾN TRÚC KỸ THUẬT NỀN TẢNG
- **Frontend**: Next.js App Router, Tailwind CSS, TypeScript.
- **Backend / API**: Next.js Server Route Handlers, Server Actions, Server Guards.
- **Database & Auth**: Supabase (PostgreSQL with RLS, Storage, Auth).
- **AI Engine**: Multi-provider Router (OpenAI GPT-4o, Google Gemini Pro) with fallback resilience and schema verification.
