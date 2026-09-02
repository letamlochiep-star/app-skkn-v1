-- ============================================================================
-- SKKN AI PHASE 8 MIGRATION: AI REVIEWER RUNS & FINDINGS
-- ============================================================================

-- 1. Ensure projects table has review stage tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS review_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Table: project_review_runs
CREATE TABLE IF NOT EXISTS public.project_review_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_draft_id UUID REFERENCES public.project_document_drafts(id) ON DELETE SET NULL,
  document_version INTEGER NOT NULL DEFAULT 1,
  review_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'AUDITING' | 'AI_REVIEWING' | 'VALIDATING' | 'READY' | 'FAILED' | 'SUPERSEDED'
  rubric_source TEXT NOT NULL DEFAULT 'DEFAULT_KNOWLEDGE_PACK', -- 'DEFAULT_KNOWLEDGE_PACK' | 'UNIT_RUBRIC'
  summary_json JSONB DEFAULT '{}'::jsonb,
  ai_request_id TEXT,
  data_version INTEGER NOT NULL DEFAULT 1,
  structure_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_review_runs_project ON public.project_review_runs(project_id);

-- 3. Table: project_review_findings
CREATE TABLE IF NOT EXISTS public.project_review_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_run_id UUID NOT NULL REFERENCES public.project_review_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'DATA' | 'EVIDENCE' | 'REFERENCE' | 'STRUCTURE' | 'SOLUTION' | 'STYLE' | ...
  severity TEXT NOT NULL DEFAULT 'MEDIUM', -- 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  finding_type TEXT NOT NULL, -- 'MANDATORY_FIX' | 'QUALITY_IMPROVEMENT' | 'KEEP_AS_IS' | 'PRIORITY_REVISION'
  section_id TEXT,
  location_json JSONB DEFAULT '{}'::jsonb,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT,
  suggested_fix TEXT,
  required_data_keys JSONB DEFAULT '[]'::jsonb,
  priority_number INTEGER, -- 1, 2, 3 for Priority Revisions
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'RESOLVED' | 'SUPERSEDED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_findings_run ON public.project_review_findings(review_run_id);
CREATE INDEX IF NOT EXISTS idx_review_findings_project ON public.project_review_findings(project_id);

-- 4. Row Level Security Policies
ALTER TABLE public.project_review_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_review_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view review runs of own projects" ON public.project_review_runs;
CREATE POLICY "Users can view review runs of own projects"
  ON public.project_review_runs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage review runs of own projects" ON public.project_review_runs;
CREATE POLICY "Users can manage review runs of own projects"
  ON public.project_review_runs FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view review findings of own projects" ON public.project_review_findings;
CREATE POLICY "Users can view review findings of own projects"
  ON public.project_review_findings FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage review findings of own projects" ON public.project_review_findings;
CREATE POLICY "Users can manage review findings of own projects"
  ON public.project_review_findings FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
