-- ============================================================================
-- SKKN AI PHASE 9 MIGRATION: DEFENSE PACKAGES, COMPONENTS & MOCK DEFENSE
-- ============================================================================

-- 1. Ensure projects table has defense stage tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS defense_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS defense_completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Table: project_defense_packages
CREATE TABLE IF NOT EXISTS public.project_defense_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES public.project_document_drafts(id) ON DELETE SET NULL,
  source_document_version INTEGER NOT NULL DEFAULT 1,
  source_review_id UUID REFERENCES public.project_review_runs(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 7, -- 5 | 7 | 10
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'GENERATING' | 'READY' | 'STALE' | 'COMPLETED' | 'FAILED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_defense_packages_project ON public.project_defense_packages(project_id);

-- 3. Table: project_defense_components
CREATE TABLE IF NOT EXISTS public.project_defense_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defense_package_id UUID NOT NULL REFERENCES public.project_defense_packages(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL, -- 'OUTLINE' | 'SCRIPT' | 'SLIDES' | 'SPEAKER_NOTES' | 'JURY_QUESTIONS' | 'ANSWER_FRAMEWORKS' | 'ONE_PAGE_SUMMARY'
  version INTEGER NOT NULL DEFAULT 1,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'READY',
  ai_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defense_components_package ON public.project_defense_components(defense_package_id, component_type);

-- 4. Table: project_defense_practice_sessions
CREATE TABLE IF NOT EXISTS public.project_defense_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  defense_package_id UUID REFERENCES public.project_defense_packages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS' | 'COMPLETED'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_defense_practice_sessions_project ON public.project_defense_practice_sessions(project_id);

-- 5. Table: project_defense_practice_turns
CREATE TABLE IF NOT EXISTS public.project_defense_practice_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.project_defense_practice_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  evaluation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defense_practice_turns_session ON public.project_defense_practice_turns(session_id);

-- 6. Row Level Security Policies
ALTER TABLE public.project_defense_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_defense_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_defense_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_defense_practice_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view defense packages of own projects" ON public.project_defense_packages;
CREATE POLICY "Users can view defense packages of own projects"
  ON public.project_defense_packages FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage defense packages of own projects" ON public.project_defense_packages;
CREATE POLICY "Users can manage defense packages of own projects"
  ON public.project_defense_packages FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view defense components of own projects" ON public.project_defense_components;
CREATE POLICY "Users can view defense components of own projects"
  ON public.project_defense_components FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage defense components of own projects" ON public.project_defense_components;
CREATE POLICY "Users can manage defense components of own projects"
  ON public.project_defense_components FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view practice sessions of own projects" ON public.project_defense_practice_sessions;
CREATE POLICY "Users can view practice sessions of own projects"
  ON public.project_defense_practice_sessions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage practice sessions of own projects" ON public.project_defense_practice_sessions;
CREATE POLICY "Users can manage practice sessions of own projects"
  ON public.project_defense_practice_sessions FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view practice turns of own projects" ON public.project_defense_practice_turns;
CREATE POLICY "Users can view practice turns of own projects"
  ON public.project_defense_practice_turns FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.project_defense_practice_sessions WHERE project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage practice turns of own projects" ON public.project_defense_practice_turns;
CREATE POLICY "Users can manage practice turns of own projects"
  ON public.project_defense_practice_turns FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.project_defense_practice_sessions WHERE project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
      )
    )
  );
