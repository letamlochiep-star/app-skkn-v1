-- ============================================================================
-- SKKN AI PHASE 6A MIGRATION: DATA COLLECTION & CONFIRMATIONS
-- ============================================================================

-- 1. Ensure projects table has data stage tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS data_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS data_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Enhance project_facts with verification and evidence tracking
ALTER TABLE public.project_facts
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED', -- 'VERIFIED_BY_USER' | 'UNVERIFIED' | 'NEEDS_CONFIRMATION' | 'NOT_APPLICABLE'
  ADD COLUMN IF NOT EXISTS evidence_status TEXT, -- 'AVAILABLE' | 'COLLECTING' | 'MISSING' | 'NOT_APPLICABLE'
  ADD COLUMN IF NOT EXISTS data_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_facts_project_key ON public.project_facts(project_id, key);

-- 3. Table: project_data_confirmations (Group-level data confirmations)
CREATE TABLE IF NOT EXISTS public.project_data_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  group_key TEXT NOT NULL, -- 'GENERAL' | 'TARGET_GROUP' | 'REALITY' | 'CAUSES' | 'GOALS' | 'SOLUTIONS' | 'EVIDENCE' | 'LOCAL_RULES'
  confirmed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_data_confirmations_project ON public.project_data_confirmations(project_id);
CREATE INDEX IF NOT EXISTS idx_data_confirmations_project_group ON public.project_data_confirmations(project_id, group_key);

-- 4. Row Level Security Policies
ALTER TABLE public.project_data_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view data confirmations of own projects" ON public.project_data_confirmations;
CREATE POLICY "Users can view data confirmations of own projects"
  ON public.project_data_confirmations FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage data confirmations of own projects" ON public.project_data_confirmations;
CREATE POLICY "Users can manage data confirmations of own projects"
  ON public.project_data_confirmations FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
