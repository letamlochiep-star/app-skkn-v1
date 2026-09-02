# SKKN AI v1.0 — Production Configuration Summary

**Document Version**: 1.0.0  
**Target Release**: SKKN AI v1.0.0 (Production)  
**Security Classification**: Sanitized Public Operational Spec (Zero Secrets)  

---

## 1. Release & Environment Metadata
- **Application Name**: SKKN AI – Sáng Kiến Kinh Nghiệm & Giải Pháp Hữu Ích
- **Release Version**: `v1.0.0`
- **Release Tag**: `v1.0.0`
- **Source Commit SHA**: `d95eef7edf8a43c04641047e1bf8c5a289b7ad5c`
- **Environment**: `production`
- **Node Environment**: `production`
- **Application Production URL**: `https://app.skkn-ai.vn`

---

## 2. Feature Flags & Modules Matrix

| Module / Feature | Status | Scope & Restrictions |
| :--- | :--- | :--- |
| **User Authentication & Profiles** | `ENABLED` | Email/Password, 72h auto-trial on signup |
| **License & Multi-Device Binding** | `ENABLED` | Max 2 devices, SHA-256 HMAC signature validation |
| **Topic Workflow (Branch A/B)** | `ENABLED` | 8-criteria pedagogical assessment, max 3-5 suggestions |
| **Smart Real Data Fact Collection**| `ENABLED` | Strict registry schema, consistency validator |
| **Pedagogical Structure & 18 Prompts**| `ENABLED` | Ministry of Education Circular 2018, 18-step atomic pipeline |
| **AI Writer & Section Editor** | `ENABLED` | Section drafting, diff versioning, full assembly |
| **AI Reviewer & Rubric Audit** | `ENABLED` | 4-dimension scoring rubric, exactly 3 priority revisions |
| **Defense Presentation Package** | `ENABLED` | `SOLUTION` type: Outline, script, slides, speaker notes, jury Q&A |
| **Export Engine (Deterministic)** | `ENABLED` | DOCX, Full PDF, Defense PPTX, One-Page PDF (0 AI Cost) |
| **Admin & Operational Console** | `ENABLED` | RBAC-gated, trial extensions, AI cost ledger, audit logging |

---

## 3. Subscription Plans & Entitlements

| Plan Code | Display Name | Duration | Projects | AI Requests | AI Token Quota | Storage | DOCX/PDF/PPTX Export | Defense Package |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TRIAL` | Gói Trải Nghiệm 3 Ngày | 3 days (72h) | 1 | 30 | 100,000 | 50 MB | ❌ Disabled | ❌ Disabled |
| `PERSONAL_MONTHLY`| Gói Giáo Viên 1 Tháng | 30 days | 5 | 300 | 1,000,000 | 500 MB | ✅ DOCX + PDF | ✅ Enabled |
| `PERSONAL_6_MONTHS`| Gói Giáo Viên 6 Tháng | 180 days | 15 | 1,500 | 5,000,000 | 2,000 MB | ✅ DOCX + PDF + PPTX | ✅ Enabled |
| `PERSONAL_YEARLY` | Gói Giáo Viên 1 Năm | 365 days | 30 | 3,000 | 10,000,000 | 5,000 MB | ✅ DOCX + PDF + PPTX | ✅ Enabled |
| `PRO` | Gói Chuyên Gia / Tổ Trưởng| 365 days | 50 | 10,000 | 30,000,000 | 10,000 MB | ✅ DOCX + PDF + PPTX | ✅ Enabled |
| `SCHOOL` | Gói Trường Học / Phòng GD | 365 days | 200 | 50,000 | 100,000,000 | 50,000 MB | ✅ DOCX + PDF + PPTX | ✅ Enabled |

---

## 4. AI Provider & Model Mappings

| Task Type | Primary Provider | Primary Model | Fallback Provider | Fallback Model | Timeout (ms) | Target JSON Schema |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `IDEATE` | OpenAI | `gpt-4o` | Google Gemini | `gemini-1.5-pro` | 30,000 | `topic-suggestions` |
| `CLASSIFY` | OpenAI | `gpt-4o-mini` | Google Gemini | `gemini-1.5-flash` | 15,000 | `topic-analysis` |
| `EXTRACT` | OpenAI | `gpt-4o-mini` | Google Gemini | `gemini-1.5-flash` | 20,000 | `data-smart-questions` |
| `DRAFT` | OpenAI | `gpt-4o` | Google Gemini | `gemini-1.5-pro` | 45,000 | `writer-section` / `defense-*` |
| `REVIEW` | OpenAI | `gpt-4o` | Google Gemini | `gemini-1.5-pro` | 45,000 | `reviewer-findings` |
| `FINALIZE` | OpenAI | `gpt-4o` | Google Gemini | `gemini-1.5-pro` | 30,000 | `defense-summary` |

---

## 5. Knowledge Pack & Prompt Versions

- **Knowledge Pack Version**: `kp-gdpt2018-v1.0.0`
- **Subject Modules Included**:
  - `math-module.md` (Toán học)
  - `natural-sciences-module.md` (Khoa học tự nhiên)
  - `literature-module.md` (Ngữ văn)
  - `informatics-module.md` (Tin học & Công nghệ)
  - `primary-module.md` (Tiểu học)
  - `secondary-module.md` (THCS)
  - `high-school-module.md` (THPT)
- **Active Prompt Versions**:
  - `skkn-topic-analyzer`: `v1.0.0` (Active)
  - `skkn-structure-proposer`: `v1.0.0` (Active)
  - `skkn-18-prompts-set`: `v1.0.0` (Active)
  - `skkn-writer-section`: `v1.0.0` (Active)
  - `skkn-reviewer-rubric`: `v1.0.0` (Active)
  - `skkn-defense-outline`: `v1.0.0` (Active)
  - `skkn-defense-slides`: `v1.0.0` (Active)
  - `skkn-defense-jury-qa`: `v1.0.0` (Active)
- **Export Template Versions**:
  - `docx-standard-skkn`: `v1.0.0`
  - `pdf-print-ready`: `v1.0.0`
  - `pptx-standard-16x9`: `v1.0.0`
  - `pdf-one-page-brief`: `v1.0.0`

---

## 6. Storage & Security Policies

- **Buckets**:
  - `uploads`: Private, RLS owner-only, max 20MB
  - `evidence`: Private, RLS owner-only, max 20MB
  - `templates`: Private, read-only system files
  - `exports`: Private, RLS owner-only, signed URL 900s TTL
- **Secrets Audit Status**:
  - `SUPABASE_SERVICE_ROLE_KEY`: `CONFIGURED` (Server-only)
  - `OPENAI_API_KEY`: `CONFIGURED` (Server-only)
  - `GEMINI_API_KEY`: `CONFIGURED` (Server-only)
  - `LICENSE_HMAC_SECRET`: `CONFIGURED` (Server-only)
  - `DEVICE_HASH_SECRET`: `CONFIGURED` (Server-only)