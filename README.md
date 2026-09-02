# SKKN AI — Trợ lý Thông minh Sáng kiến Kinh nghiệm & Giải pháp Hữu ích

> **PHASE 0: FOUNDATION & GUARDRAILS**  
> Nền tảng kỹ thuật, cấu trúc repository, Database foundation, Row Level Security, AI Abstraction & Router, Skill Loader, Knowledge Module Selector, JSON Schema Validator và bộ kiểm thử tự động.

---

## 1. Tổng quan Dự án (Project Overview)

SKKN AI là hệ thống webapp chuyên biệt hỗ trợ giáo viên và cán bộ quản lý giáo dục các cấp (Mầm non, Tiểu học, THCS, THPT, GDTX, CĐ/ĐH) xây dựng, phát triển và hoàn thiện các bản báo cáo Sáng kiến kinh nghiệm (SKKN) và Giải pháp hữu ích chuẩn Chương trình GDPT 2018 của Bộ GD&ĐT.

---

## 2. Kiến trúc Hệ thống (Architecture)

```text
skkn-ai-webapp/
├── app/                  # Next.js App Router (Public, Auth, Dashboard, API Health Handlers)
├── components/           # UI primitives & layout shells
├── lib/
│   ├── config/           # Zod-validated Environment (env.ts) & AI Config (ai.ts)
│   ├── supabase/         # Isolated Clients (Browser, Server SSR, Admin Service Role)
│   ├── ai/               # AI Provider Abstraction (OpenAI, Gemini) & Task Router
│   ├── skill/            # Skill Loader with in-memory caching & path traversal guard
│   ├── knowledge/        # Context-aware Knowledge Module Selector
│   ├── schemas/          # JSON Schema Registry (Draft-07 / 2020-12)
│   ├── validation/       # Ajv JSON Schema Validator
│   └── utils/            # Tailwind class merging & formatting utilities
├── server/
│   ├── services/         # AI Usage Logging & Cost Tracking Service
│   ├── repositories/     # Base Data Access Repositories
│   └── guards/           # Auth, Project Ownership & Entitlement Guards
├── knowledge/            # Core Skill Manual, Agents & Reference Modules
│   └── skkn-giai-phap-writer/
│       ├── SKILL.md
│       ├── agents/
│       ├── references/
│       └── scripts/
├── supabase/             # PostgreSQL Migrations & Seed Data
│   ├── migrations/
│   └── seed/
├── tests/                # Vitest Unit Tests & Fixtures
│   ├── fixtures/
│   └── unit/
└── types/                # Strict TypeScript Contracts & DB definitions
```

---

## 3. Thiết lập Môi trường (Environment Setup)

1. Sao chép file cấu hình mẫu:
   ```bash
   cp .env.example .env.local
   ```

2. Cập nhật các giá trị trong `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Supabase Public Config
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Supabase Admin Config (Chỉ dùng trên Server)
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # AI Provider Keys (Chỉ dùng trên Server)
   OPENAI_API_KEY=sk-proj-your-openai-key
   GEMINI_API_KEY=your-gemini-key

   # Routing & Models
   AI_PRIMARY_PROVIDER=openai
   AI_FALLBACK_PROVIDER=gemini
   AI_CLASSIFY_MODEL=gpt-4o-mini
   AI_EXTRACT_MODEL=gpt-4o-mini
   AI_DRAFT_MODEL=gpt-4o
   AI_REVIEW_MODEL=gpt-4o
   AI_FINALIZE_MODEL=gpt-4o
   ```

---

## 4. Thiết lập Supabase (Supabase & Database Setup)

1. Migration cơ sở dữ liệu nằm tại:
   `supabase/migrations/20260902000001_phase0_foundation_schema.sql`
2. Tạo 11 bảng cốt lõi với UUID & timestamp triggers:
   - `profiles`, `projects`, `project_facts`, `project_sections`
   - `uploaded_files`, `ai_requests`, `prompt_versions`, `devices`
   - `subscriptions`, `licenses`, `audit_logs`
3. Row Level Security (RLS) được kích hoạt trên tất cả bảng đảm bảo người dùng chỉ truy cập dữ liệu của chính mình.

---

## 5. Kiến trúc AI Router & Provider Abstraction

- **Provider Abstraction**: Giao tiếp chuẩn qua interface `AIProvider` (`generateText`, `generateStructured`, `analyzeDocument`, `reviewDocument`).
- **Adapter triển khai**: `OpenAIProvider` và `GeminiProvider`.
- **Task-based Routing**: Hỗ trợ 6 nhóm tác vụ: `CLASSIFY`, `EXTRACT`, `IDEATE`, `DRAFT`, `REVIEW`, `FINALIZE`.
- **Tự động Fallback**: Khi primary provider lỗi hoặc timeout, router tự động chuyển sang fallback provider.
- **Strict Schema Enforcement**: Mọi structured output bắt buộc validate qua `Ajv` validator trước khi trả về.

---

## 6. Hướng dẫn Chạy & Kiểm thử (How to Run & Test)

### Cài đặt Dependencies:
```bash
npm install
```

### Chạy Development Server:
```bash
npm run dev
```

### Chạy Kiểm thử Tự động (Unit Tests):
```bash
npm test
```

### Kiểm tra TypeScript & Lint:
```bash
npm run typecheck
npm run lint
```

### Build Production:
```bash
npm run build
```

---

## 7. Giới hạn Phạm vi Phase 0 (Phase 0 Scope & Limitations)

Phase 0 tập trung xây dựng nền tảng và guardrails kỹ thuật:
- **Chưa triển khai**: Giao diện đăng nhập/đăng ký đầy đủ, thanh toán, license key UI, quy trình viết 5 bước hoàn chỉnh, AI Writer UI, Admin console, xuất file Word/PDF.
- **Đã hoàn thành**: Nền tảng DB, RLS, Client isolation, AI abstraction, Skill loader, Knowledge selector, JSON Schema validator, Server guards, Health API endpoints, Test suite.

---

## 8. Kế hoạch Phase 1 (Next Phase)

- **Phase 1: Smart Data Collection & Context Extraction**:
  - Triển khai giao diện bộ câu hỏi thông minh 4 trụ cột.
  - Phân tích và trích xuất hồ sơ minh chứng tải lên.
  - Quản lý phiên làm việc (`skkn-session`) kết nối trực tiếp database.
