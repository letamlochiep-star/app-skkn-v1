# SKKN AI v1.0 — Production Deployment Checklist

**Release Target**: SKKN AI v1.0.0  
**Environment**: Production  
**Date**: September 2026  
**Status**: ACTIVE / EXECUTING  

---

## 1. Pre-Deployment Phase
- [x] Phase 0–12 completed with verdict: `GO FOR PRODUCTION`.
- [x] Zero Critical security vulnerabilities (`Critical = 0`).
- [x] Zero High security vulnerabilities (`High = 0`).
- [x] 100% Vitest test suites passing (`96 / 96 Suites`, `195 / 195 Tests`).
- [x] TypeScript compiler passes without errors (`tsc --noEmit`).
- [x] ESLint passes without errors or warnings (`next lint`).
- [x] Clean Next.js production build (`next build`) successful with 48 static/dynamic routes.
- [x] Master PRD and architecture specification alignment verified.

---

## 2. Database & Migration
- [x] Production database isolated from development/staging.
- [x] Production database snapshot / baseline backup recorded (`backup_id: bkp_prod_skkn_v1_init`).
- [x] Restore runbook verified and documented (`docs/PRODUCTION_RUNBOOK.md`).
- [x] All 13 migrations verified from clean database state:
  - `20260902000001_phase0_foundation_schema.sql`
  - `20260902000002_phase1_auth_trial_profile.sql`
  - `20260902000003_phase2_plans_quotas_usage.sql`
  - `20260902000004_phase3_licenses_devices_activations.sql`
  - `20260902000005_phase4_projects_management.sql`
  - `20260902000006_phase5_topic_candidates_history.sql`
  - `20260902000007_phase6a_data_collection.sql`
  - `20260902000008_phase6b_structures_and_prompts.sql`
  - `20260902000009_phase7_writer_and_document_drafts.sql`
  - `20260902000010_phase8_reviewer.sql`
  - `20260902000011_phase9_defense_presentation.sql`
  - `20260902000012_phase10_export_engine.sql`
  - `20260902000013_phase11_admin_operations.sql`
- [x] Idempotent seeds verified: Plans, Entitlements, Active Prompt Versions, Knowledge metadata.

---

## 3. Row-Level Security (RLS) & Authorization
- [x] RLS explicitly enabled on all 20 core application tables:
  - `profiles`
  - `projects`
  - `project_facts`
  - `project_sections`
  - `uploaded_files`
  - `subscriptions`
  - `subscription_entitlements`
  - `licenses`
  - `devices`
  - `usage_ledger`
  - `topic_candidates`
  - `structures`
  - `prompt_sets`
  - `project_prompts`
  - `document_drafts`
  - `review_runs`
  - `review_findings`
  - `defense_packages`
  - `export_jobs`
  - `export_artifacts`
- [x] Multi-tenant cross-user access rejection verified.

---

## 4. Supabase Auth & Email Flows
- [x] Site URL configured to production domain (`https://app.skkn-ai.vn`).
- [x] Production Auth Redirect URLs configured (`/dashboard`, `/login`, `/reset-password`, `/auth/callback`).
- [x] Unnecessary localhost redirects stripped from production allowlist.
- [x] Email verification flow: Register → Verify Email → Profile/Trial Auto-Init trigger.
- [x] Password recovery flow: Forgot Password → Production Reset Link → Password Update → Login.

---

## 5. Storage Configuration
- [x] Dedicated storage buckets configured:
  - `uploads` (Private)
  - `evidence` (Private)
  - `templates` (Private/Internal)
  - `exports` (Private)
- [x] Storage access policies enforced (user can only read/download own files).
- [x] Secure signed URLs with configurable expiration time (default 15 minutes).
- [x] File size limit enforced (max 20MB per upload).
- [x] Allowed MIME types whitelist enforced (`.docx`, `.pdf`, `.png`, `.jpg`, `.xlsx`).

---

## 6. Environment Variables & Secret Audit
- [x] `NEXT_PUBLIC_SUPABASE_URL` = Configured (Production URL).
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Configured (Production Anon Key).
- [x] `SUPABASE_SERVICE_ROLE_KEY` = Configured (Server-only, no `NEXT_PUBLIC_` prefix).
- [x] `OPENAI_API_KEY` = Configured (Server-only).
- [x] `GEMINI_API_KEY` = Configured (Server-only fallback).
- [x] `LICENSE_HMAC_SECRET` = Configured (Server-only).
- [x] `DEVICE_HASH_SECRET` = Configured (Server-only).
- [x] `APP_URL` = Configured (`https://app.skkn-ai.vn`).
- [x] `NODE_ENV` = `production`.
- [x] No secrets present in client bundle or network responses.

---

## 7. Application Build & Deployment
- [x] Source code repository commit: `d95eef7edf8a43c04641047e1bf8c5a289b7ad5c` (`main` branch).
- [x] Production bundle deployed on hosting platform (Vercel / Container).
- [x] Zero-downtime / Preview-first deployment strategy active.

---

## 8. Domain, HTTPS & Security Headers
- [x] Domain: `https://app.skkn-ai.vn`.
- [x] Enforced HTTPS with TLS 1.3 / HSTS.
- [x] Secure Cookie flags enabled (`Secure`, `HttpOnly`, `SameSite=Lax`).
- [x] Security headers active:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 9. Admin Bootstrap
- [x] First admin created via trusted server-side bootstrap command (`AdminRepository.bootstrapFirstAdmin`).
- [x] No `role=admin` exposed on public registration form.
- [x] Audit record `ADMIN_BOOTSTRAPPED` logged.
- [x] Last active admin deletion protection verified.

---

## 10. Smoke Tests & Verification
- [x] `/api/health` and `/api/health/ai` endpoints return `200 OK`.
- [x] User registration, 72-hour trial provisioning, and login persistence.
- [x] Project creation and Topic analysis.
- [x] AI Router execution and usage recording.
- [x] License key issuance and hardware device binding.
- [x] Export Engine: Deterministic DOCX, PDF, PPTX generation with 0 AI cost.
- [x] Multi-tenant cross-user access rejection (negative test).
- [x] Admin console telemetry and audit logging.

---

## 11. Monitoring & Observability
- [x] Error tracking and logging active.
- [x] AI cost tracking ledger recording tokens and estimated USD cost.
- [x] Export job status monitoring and failure alerts.
- [x] Database connection pool and storage metrics active.

---

## 12. Rollback Readiness
- [x] Immediate rollback trigger criteria documented.
- [x] Previous deployment image available for instant revert.
- [x] Point-In-Time Database recovery SOP ready.
- [x] Zero user data loss guarantee upon rollback.