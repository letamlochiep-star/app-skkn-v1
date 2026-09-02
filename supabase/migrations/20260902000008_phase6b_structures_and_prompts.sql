-- ============================================================================
-- SKKN AI PHASE 6B MIGRATION: STRUCTURES & 18-PROMPT SETS
-- ============================================================================

-- 1. Ensure projects table has structure and prompt stage tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS structure_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS structure_locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prompts_completed_at TIMESTAMPTZ;

-- 2. Table: project_structures
CREATE TABLE IF NOT EXISTS public.project_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PROPOSED', -- 'DRAFT' | 'PROPOSED' | 'USER_EDITED' | 'LOCKED' | 'SUPERSEDED'
  source TEXT NOT NULL DEFAULT 'AI_PROPOSED', -- 'AI_PROPOSED' | 'UNIT_TEMPLATE' | 'USER_CREATED' | 'USER_EDITED'
  structure_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_version INTEGER NOT NULL DEFAULT 1,
  topic_version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_project_structures_project ON public.project_structures(project_id);
CREATE INDEX IF NOT EXISTS idx_project_structures_status ON public.project_structures(project_id, status);

-- 3. Table: project_prompt_sets
CREATE TABLE IF NOT EXISTS public.project_prompt_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES public.project_structures(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'GENERATING', -- 'GENERATING' | 'VALIDATING' | 'READY' | 'FAILED' | 'SUPERSEDED'
  prompt_count INTEGER NOT NULL DEFAULT 18,
  data_version INTEGER NOT NULL DEFAULT 1,
  prompt_framework_version TEXT NOT NULL DEFAULT '18-prompt-framework-v1',
  ai_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prompt_sets_project ON public.project_prompt_sets(project_id);

-- 4. Table: project_prompts (Each of the exactly 18 prompts)
CREATE TABLE IF NOT EXISTS public.project_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_set_id UUID NOT NULL REFERENCES public.project_prompt_sets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_number INTEGER NOT NULL, -- 1 to 18
  title TEXT NOT NULL,
  purpose TEXT,
  prompt_text TEXT NOT NULL,
  required_data_keys JSONB DEFAULT '[]'::jsonb,
  missing_data_keys JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'READY', -- 'READY' | 'READY_WITH_PLACEHOLDERS' | 'BLOCKED'
  immutable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_prompt_set_number UNIQUE (prompt_set_id, prompt_number)
);

CREATE INDEX IF NOT EXISTS idx_prompts_set_number ON public.project_prompts(prompt_set_id, prompt_number);

-- 5. Row Level Security Policies
ALTER TABLE public.project_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_prompt_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view structures of own projects" ON public.project_structures;
CREATE POLICY "Users can view structures of own projects"
  ON public.project_structures FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage structures of own projects" ON public.project_structures;
CREATE POLICY "Users can manage structures of own projects"
  ON public.project_structures FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view prompt sets of own projects" ON public.project_prompt_sets;
CREATE POLICY "Users can view prompt sets of own projects"
  ON public.project_prompt_sets FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage prompt sets of own projects" ON public.project_prompt_sets;
CREATE POLICY "Users can manage prompt sets of own projects"
  ON public.project_prompt_sets FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view prompts of own projects" ON public.project_prompts;
CREATE POLICY "Users can view prompts of own projects"
  ON public.project_prompts FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage prompts of own projects" ON public.project_prompts;
CREATE POLICY "Users can manage prompts of own projects"
  ON public.project_prompts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
