-- ============================================================================
-- SKKN AI PHASE 10 MIGRATION: EXPORT ENGINE, TEMPLATES, ARTIFACTS & DOWNLOADS
-- ============================================================================

-- 1. Table: export_templates
CREATE TABLE IF NOT EXISTS public.export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  artifact_type TEXT NOT NULL, -- 'DOCX' | 'FULL_PDF' | 'DEFENSE_PPTX' | 'ONE_PAGE_PDF'
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
  version INTEGER NOT NULL DEFAULT 1,
  configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default templates
INSERT INTO public.export_templates (code, name, artifact_type, configuration_json)
VALUES
  ('DEFAULT_SKKN_DOCX', 'Mẫu Chuẩn SKKN Bộ GD&ĐT (Word)', 'DOCX', '{"pageSize":"A4","margins":{"top":2,"bottom":2,"left":3,"right":1.5},"font":{"family":"Times New Roman","size":14,"lineSpacing":1.5}}'::jsonb),
  ('DEFAULT_SOLUTION_DOCX', 'Mẫu Chuẩn Giải pháp Hữu ích (Word)', 'DOCX', '{"pageSize":"A4","margins":{"top":2,"bottom":2,"left":3,"right":1.5},"font":{"family":"Times New Roman","size":14,"lineSpacing":1.5}}'::jsonb),
  ('DEFAULT_FULL_PDF', 'Mẫu Xuất PDF Toàn văn Chuẩn in', 'FULL_PDF', '{"pageSize":"A4","margins":{"top":2,"bottom":2,"left":3,"right":1.5},"font":{"family":"Times New Roman","size":14}}'::jsonb),
  ('DEFAULT_DEFENSE_PPTX', 'Mẫu Thuyết trình Hội đồng Chuẩn (16:9)', 'DEFENSE_PPTX', '{"aspectRatio":"16:9","theme":"CLASSIC_BLUE","minFontSize":18}'::jsonb),
  ('DEFAULT_ONE_PAGE_PDF', 'Mẫu Tóm tắt 1 Trang A4 BGK', 'ONE_PAGE_PDF', '{"pageSize":"A4","maxPages":1,"columns":2}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2. Table: project_export_jobs
CREATE TABLE IF NOT EXISTS public.project_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL, -- 'DOCX' | 'FULL_PDF' | 'DEFENSE_PPTX' | 'ONE_PAGE_PDF'
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'GENERATING' | 'VALIDATING' | 'READY' | 'FAILED' | 'STALE' | 'EXPIRED'
  request_id TEXT,
  source_document_id UUID REFERENCES public.project_document_drafts(id) ON DELETE SET NULL,
  source_document_version INTEGER NOT NULL DEFAULT 1,
  source_review_id UUID REFERENCES public.project_review_runs(id) ON DELETE SET NULL,
  source_review_version INTEGER NOT NULL DEFAULT 1,
  source_defense_package_id UUID REFERENCES public.project_defense_packages(id) ON DELETE SET NULL,
  source_defense_version INTEGER NOT NULL DEFAULT 1,
  template_id UUID REFERENCES public.export_templates(id) ON DELETE SET NULL,
  template_version INTEGER NOT NULL DEFAULT 1,
  options_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  fingerprint TEXT NOT NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_project ON public.project_export_jobs(project_id, export_type);
CREATE INDEX IF NOT EXISTS idx_export_jobs_fingerprint ON public.project_export_jobs(fingerprint);

-- 3. Table: project_export_artifacts
CREATE TABLE IF NOT EXISTS public.project_export_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_job_id UUID NOT NULL REFERENCES public.project_export_jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_export_artifacts_project ON public.project_export_artifacts(project_id, artifact_type);

-- 4. Table: project_export_downloads
CREATE TABLE IF NOT EXISTS public.project_export_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.project_export_artifacts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash_optional TEXT,
  user_agent_summary_optional TEXT
);

CREATE INDEX IF NOT EXISTS idx_export_downloads_artifact ON public.project_export_downloads(artifact_id);

-- 5. Row Level Security Policies
ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_export_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_export_downloads ENABLE ROW LEVEL SECURITY;

-- Templates: Everyone authenticated can view active templates
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON public.export_templates;
CREATE POLICY "Authenticated users can view active templates"
  ON public.export_templates FOR SELECT
  USING (status = 'ACTIVE');

-- Export Jobs
DROP POLICY IF EXISTS "Users can view export jobs of own projects" ON public.project_export_jobs;
CREATE POLICY "Users can view export jobs of own projects"
  ON public.project_export_jobs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage export jobs of own projects" ON public.project_export_jobs;
CREATE POLICY "Users can manage export jobs of own projects"
  ON public.project_export_jobs FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Export Artifacts
DROP POLICY IF EXISTS "Users can view export artifacts of own projects" ON public.project_export_artifacts;
CREATE POLICY "Users can view export artifacts of own projects"
  ON public.project_export_artifacts FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage export artifacts of own projects" ON public.project_export_artifacts;
CREATE POLICY "Users can manage export artifacts of own projects"
  ON public.project_export_artifacts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Download History
DROP POLICY IF EXISTS "Users can view download history of own projects" ON public.project_export_downloads;
CREATE POLICY "Users can view download history of own projects"
  ON public.project_export_downloads FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert download records of own projects" ON public.project_export_downloads;
CREATE POLICY "Users can insert download records of own projects"
  ON public.project_export_downloads FOR INSERT
  WITH CHECK (user_id = auth.uid());
