-- ============================================================================
-- SKKN AI PHASE 4 MIGRATION: PROJECTS MANAGEMENT & PROJECT FACTS
-- ============================================================================

-- 1. Ensure all required columns exist on projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS working_title TEXT,
  ADD COLUMN IF NOT EXISTS grade_level TEXT,
  ADD COLUMN IF NOT EXISTS school_year TEXT DEFAULT '2026-2027',
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Performance Indexes for Project Listing, Filtering, and Sorting
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_last_opened ON public.projects(user_id, last_opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_user_doc_type ON public.projects(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);

-- 3. Project Facts Table Constraints & Indexes
CREATE INDEX IF NOT EXISTS idx_project_facts_project ON public.project_facts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_facts_key ON public.project_facts(project_id, key);

-- 4. Row Level Security Policies for Phase 4
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own non-deleted projects" ON public.projects;
CREATE POLICY "Users can view own non-deleted projects"
  ON public.projects FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid());

-- Project Facts RLS
ALTER TABLE public.project_facts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view facts of own projects" ON public.project_facts;
CREATE POLICY "Users can view facts of own projects"
  ON public.project_facts FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage facts of own projects" ON public.project_facts;
CREATE POLICY "Users can manage facts of own projects"
  ON public.project_facts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
