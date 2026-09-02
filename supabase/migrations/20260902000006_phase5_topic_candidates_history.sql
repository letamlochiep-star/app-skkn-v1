-- ============================================================================
-- SKKN AI PHASE 5 MIGRATION: TOPIC CANDIDATES & TOPIC HISTORY
-- ============================================================================

-- 1. Ensure projects table has lock tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS topic_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS topic_locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Table: project_topic_candidates
CREATE TABLE IF NOT EXISTS public.project_topic_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'AI_SUGGESTED', -- 'USER_INPUT' | 'AI_SUGGESTED' | 'USER_EDITED'
  title TEXT NOT NULL,
  rationale TEXT,
  strengths_json JSONB DEFAULT '[]'::jsonb,
  evidence_feasibility TEXT,
  notes TEXT,
  rank INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PROPOSED', -- 'PROPOSED' | 'SELECTED' | 'REJECTED' | 'LOCKED'
  ai_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_candidates_project ON public.project_topic_candidates(project_id);
CREATE INDEX IF NOT EXISTS idx_topic_candidates_status ON public.project_topic_candidates(project_id, status);

-- 3. Table: project_topic_history
CREATE TABLE IF NOT EXISTS public.project_topic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'LOCKED' | 'UNLOCKED' | 'CHANGED'
  previous_title TEXT,
  new_title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_history_project ON public.project_topic_history(project_id);

-- 4. Row Level Security Policies for Phase 5
ALTER TABLE public.project_topic_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view topic candidates of own projects" ON public.project_topic_candidates;
CREATE POLICY "Users can view topic candidates of own projects"
  ON public.project_topic_candidates FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage topic candidates of own projects" ON public.project_topic_candidates;
CREATE POLICY "Users can manage topic candidates of own projects"
  ON public.project_topic_candidates FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

ALTER TABLE public.project_topic_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view topic history of own projects" ON public.project_topic_history;
CREATE POLICY "Users can view topic history of own projects"
  ON public.project_topic_history FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
