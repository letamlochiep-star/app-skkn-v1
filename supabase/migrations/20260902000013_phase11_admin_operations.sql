-- ============================================================================
-- SKKN AI PHASE 11 MIGRATION: ADMIN & OPERATIONS PLATFORM
-- ============================================================================

-- 1. Add role column to profiles table if not exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'TEACHER'; -- 'TEACHER' | 'ADMIN' | 'SUPPORT'

-- 2. Table: system_audit_logs
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'USER_ROLE_UPDATED' | 'TRIAL_EXTENDED' | 'PLAN_UPGRADED' | 'LICENSE_GENERATED' | 'LICENSE_REVOKED' | 'DEVICE_DEACTIVATED' | 'EXPORT_PURGED'
  resource_type TEXT NOT NULL, -- 'USER' | 'LICENSE' | 'DEVICE' | 'PROJECT' | 'EXPORT' | 'SYSTEM'
  resource_id TEXT,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.system_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.system_audit_logs(created_at DESC);

-- 3. Row Level Security Policies
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view and insert audit logs
DROP POLICY IF EXISTS "Admins can view system audit logs" ON public.system_audit_logs;
CREATE POLICY "Admins can view system audit logs"
  ON public.system_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.system_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.system_audit_logs FOR INSERT
  WITH CHECK (true);
