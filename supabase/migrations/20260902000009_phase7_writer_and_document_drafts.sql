-- ============================================================================
-- SKKN AI PHASE 7 MIGRATION: WRITER, SECTIONS, VERSIONS & DOCUMENT DRAFTS
-- ============================================================================

-- 1. Ensure projects table has writer completion tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS writer_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS writer_completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Table: project_writing_runs
CREATE TABLE IF NOT EXISTS public.project_writing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_set_id UUID REFERENCES public.project_prompt_sets(id) ON DELETE SET NULL,
  prompt_id UUID REFERENCES public.project_prompts(id) ON DELETE SET NULL,
  prompt_number INTEGER NOT NULL,
  logical_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'GENERATING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'STALE'
  data_version INTEGER NOT NULL DEFAULT 1,
  structure_version INTEGER NOT NULL DEFAULT 1,
  prompt_set_version INTEGER NOT NULL DEFAULT 1,
  ai_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_writing_runs_project ON public.project_writing_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_writing_runs_prompt_number ON public.project_writing_runs(project_id, prompt_number);

-- 3. Table: project_sections
CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  structure_section_id UUID REFERENCES public.project_structures(id) ON DELETE SET NULL,
  prompt_number INTEGER NOT NULL, -- 1 to 18
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'USER_EDITED' | 'APPROVED' | 'BLOCKED' | 'STALE'
  source TEXT NOT NULL DEFAULT 'AI_GENERATED', -- 'AI_GENERATED' | 'USER_EDITED' | 'USER_CREATED' | 'ASSEMBLED'
  version INTEGER NOT NULL DEFAULT 1,
  data_version INTEGER NOT NULL DEFAULT 1,
  structure_version INTEGER NOT NULL DEFAULT 1,
  prompt_set_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_project_prompt_section UNIQUE (project_id, prompt_number)
);

CREATE INDEX IF NOT EXISTS idx_project_sections_project ON public.project_sections(project_id);

-- 4. Table: project_section_versions
CREATE TABLE IF NOT EXISTS public.project_section_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.project_sections(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_number INTEGER NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ai_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_section_versions_section ON public.project_section_versions(section_id, version);

-- 5. Table: project_document_drafts
CREATE TABLE IF NOT EXISTS public.project_document_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  plain_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'ASSEMBLING' | 'DRAFT' | 'READY_FOR_REVIEW' | 'STALE'
  placeholder_summary JSONB DEFAULT '{}'::jsonb,
  data_version INTEGER NOT NULL DEFAULT 1,
  structure_version INTEGER NOT NULL DEFAULT 1,
  prompt_set_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_drafts_project ON public.project_document_drafts(project_id);

-- 6. Row Level Security Policies
ALTER TABLE public.project_writing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_section_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_document_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view writing runs of own projects" ON public.project_writing_runs;
CREATE POLICY "Users can view writing runs of own projects"
  ON public.project_writing_runs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage writing runs of own projects" ON public.project_writing_runs;
CREATE POLICY "Users can manage writing runs of own projects"
  ON public.project_writing_runs FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view sections of own projects" ON public.project_sections;
CREATE POLICY "Users can view sections of own projects"
  ON public.project_sections FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage sections of own projects" ON public.project_sections;
CREATE POLICY "Users can manage sections of own projects"
  ON public.project_sections FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view section versions of own projects" ON public.project_section_versions;
CREATE POLICY "Users can view section versions of own projects"
  ON public.project_section_versions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage section versions of own projects" ON public.project_section_versions;
CREATE POLICY "Users can manage section versions of own projects"
  ON public.project_section_versions FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view document drafts of own projects" ON public.project_document_drafts;
CREATE POLICY "Users can view document drafts of own projects"
  ON public.project_document_drafts FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage document drafts of own projects" ON public.project_document_drafts;
CREATE POLICY "Users can manage document drafts of own projects"
  ON public.project_document_drafts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
