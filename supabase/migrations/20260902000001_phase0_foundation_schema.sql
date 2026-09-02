-- ============================================================================
-- SKKN AI DATABASE FOUNDATION MIGRATION (PHASE 0)
-- Tables: profiles, projects, project_facts, project_sections, uploaded_files,
--         ai_requests, prompt_versions, devices, subscriptions, licenses, audit_logs
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  school_name TEXT,
  education_level TEXT, -- PRIMARY, SECONDARY, HIGH_SCHOOL, OTHER
  subject_specialty TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. PROJECTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'SKKN' CHECK (type IN ('SKKN', 'GIAI_PHAP_HUU_ICH')),
  subject_group TEXT NOT NULL,
  education_level TEXT NOT NULL,
  target_grade TEXT,
  school_year TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'REVIEWING', 'COMPLETED', 'ARCHIVED')),
  current_step INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. PROJECT_FACTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_category TEXT NOT NULL, -- CONTEXT, PROBLEM, SOLUTION, EVIDENCE, APPLICABILITY
  fact_value JSONB NOT NULL,
  source TEXT DEFAULT 'USER_INPUT', -- USER_INPUT, EXTRACTED_DOC, AI_ENRICHED
  confidence_score NUMERIC(4, 3) DEFAULT 1.000,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_project_fact_key UNIQUE(project_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_project_facts_project_id ON public.project_facts(project_id);
CREATE TRIGGER update_project_facts_updated_at
  BEFORE UPDATE ON public.project_facts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. PROJECT_SECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL, -- INTRODUCTION, THEORETICAL_BASIS, REALITY, MEASURES, EFFECTIVENESS, CONCLUSION
  section_title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  content_markdown TEXT DEFAULT '',
  status TEXT DEFAULT 'EMPTY' CHECK (status IN ('EMPTY', 'DRAFTED', 'REVIEWED', 'FINALIZED')),
  ai_version INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_project_section_key UNIQUE(project_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_project_sections_project_id ON public.project_sections(project_id);
CREATE TRIGGER update_project_sections_updated_at
  BEFORE UPDATE ON public.project_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. UPLOADED_FILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  parsed_content TEXT,
  extraction_status TEXT DEFAULT 'PENDING' CHECK (extraction_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON public.uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_project_id ON public.uploaded_files(project_id);
CREATE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6. AI_REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL, -- CLASSIFY, EXTRACT, IDEATE, DRAFT, REVIEW, FINALIZE
  provider TEXT NOT NULL,  -- openai, gemini
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10, 6) DEFAULT 0.000000,
  status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'FALLBACK_SUCCESS')),
  error_code TEXT,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON public.ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_project_id ON public.ai_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON public.ai_requests(created_at);

-- ----------------------------------------------------------------------------
-- 7. PROMPT_VERSIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  version TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_template TEXT NOT NULL,
  target_schema JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_prompt_key_version UNIQUE(prompt_key, version)
);

CREATE TRIGGER update_prompt_versions_updated_at
  BEFORE UPDATE ON public.prompt_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 8. DEVICES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_user_device UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_tier TEXT DEFAULT 'FREE_TRIAL' CHECK (plan_tier IN ('FREE_TRIAL', 'STANDARD', 'PRO', 'ENTERPRISE')),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
  starts_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  max_projects INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 10. LICENSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('STANDARD', 'PRO', 'INSTITUTIONAL')),
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_devices INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_licenses_assigned_user ON public.licenses(assigned_user_id);
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 11. AUDIT_LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ip_address TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Projects Policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Project Facts Policies (Inherits project ownership)
CREATE POLICY "Users can manage facts of their own projects"
  ON public.project_facts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_facts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 4. Project Sections Policies (Inherits project ownership)
CREATE POLICY "Users can manage sections of their own projects"
  ON public.project_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_sections.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 5. Uploaded Files Policies
CREATE POLICY "Users can manage their own uploaded files"
  ON public.uploaded_files FOR ALL
  USING (auth.uid() = user_id);

-- 6. AI Requests Policies
CREATE POLICY "Users can view their own AI requests"
  ON public.ai_requests FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Devices Policies
CREATE POLICY "Users can manage their own devices"
  ON public.devices FOR ALL
  USING (auth.uid() = user_id);

-- 8. Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 9. Licenses Policies
CREATE POLICY "Users can view assigned licenses"
  ON public.licenses FOR SELECT
  USING (auth.uid() = assigned_user_id);

-- 10. Prompt Versions (Public Read for authenticated users)
CREATE POLICY "Authenticated users can read prompt versions"
  ON public.prompt_versions FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- 11. Audit logs (Insert allowed for user events, read own logs)
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);
