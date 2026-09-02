-- ============================================================================
-- SKKN AI PHASE 2 MIGRATION: PLANS, TRIAL QUOTA, USAGE LEDGER & ENTITLEMENTS
-- ============================================================================

-- 1. Table: plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'ARCHIVED'
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_projects INTEGER NOT NULL DEFAULT 1,
  max_ai_requests INTEGER NOT NULL DEFAULT 30,
  max_ai_tokens BIGINT NOT NULL DEFAULT 100000,
  max_storage_mb INTEGER NOT NULL DEFAULT 50,
  can_export_docx BOOLEAN NOT NULL DEFAULT FALSE,
  can_export_pdf BOOLEAN NOT NULL DEFAULT FALSE,
  can_export_pptx BOOLEAN NOT NULL DEFAULT FALSE,
  can_use_ai_review BOOLEAN NOT NULL DEFAULT TRUE,
  can_use_defense_presentation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: subscription_entitlements (Snapshot attached to subscription)
CREATE TABLE IF NOT EXISTS public.subscription_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  feature_code TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT TRUE,
  limit_value BIGINT, -- NULL if unlimited or boolean feature
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_entitlements_sub ON public.subscription_entitlements(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_entitlements_feature ON public.subscription_entitlements(feature_code);

-- 3. Table: usage_ledger (Immutable ledger for quota tracking)
CREATE TABLE IF NOT EXISTS public.usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  quantity BIGINT NOT NULL DEFAULT 1,
  idempotency_key TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_ledger_user ON public.usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_sub ON public.usage_ledger(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_feature ON public.usage_ledger(feature);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_ledger_idempotency ON public.usage_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 4. Table: upgrade_requests
CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_plan_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_user ON public.upgrade_requests(user_id);

-- 5. Seed Initial Plans (Idempotent Upsert)
INSERT INTO public.plans (
  code, name, description, status, duration_days,
  max_projects, max_ai_requests, max_ai_tokens, max_storage_mb,
  can_export_docx, can_export_pdf, can_export_pptx,
  can_use_ai_review, can_use_defense_presentation
)
VALUES
  (
    'TRIAL',
    'Gói Trải Nghiệm 3 Ngày',
    'Dùng thử miễn phí toàn bộ tính năng trợ lý SKKN trong 3 ngày với hạn mức cơ bản.',
    'ACTIVE',
    3,
    1,
    30,
    100000,
    50,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    FALSE
  ),
  (
    'PERSONAL_MONTHLY',
    'Gói Giáo Viên 1 Tháng',
    'Dành cho giáo viên hoàn thiện 1-3 đề tài SKKN trong tháng cao điểm.',
    'ACTIVE',
    30,
    5,
    300,
    1000000,
    500,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    TRUE
  ),
  (
    'PERSONAL_6_MONTHS',
    'Gói Giáo Viên 6 Tháng',
    'Dành cho giáo viên chủ nhiệm & tổ trưởng chuyên môn trong học kỳ.',
    'ACTIVE',
    180,
    15,
    1500,
    5000000,
    2000,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
  ),
  (
    'PERSONAL_YEARLY',
    'Gói Giáo Viên 1 Năm',
    'Giải pháp toàn diện cả năm học cho SKKN và Giải pháp hữu ích.',
    'ACTIVE',
    365,
    30,
    3000,
    10000000,
    5000,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
  ),
  (
    'PRO',
    'Gói Chuyên Gia / Tổ Trưởng',
    'Không giới hạn tính năng, ưu tiên xử lý tốc độ cao và chấm phản biện chuyên sâu.',
    'ACTIVE',
    365,
    50,
    10000,
    30000000,
    10000,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
  ),
  (
    'SCHOOL',
    'Gói Trường Học / Phòng GD',
    'Bản quyền tập trung cho hội đồng sư phạm nhà trường.',
    'ACTIVE',
    365,
    200,
    50000,
    100000000,
    50000,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_days = EXCLUDED.duration_days,
  max_projects = EXCLUDED.max_projects,
  max_ai_requests = EXCLUDED.max_ai_requests,
  max_ai_tokens = EXCLUDED.max_ai_tokens,
  max_storage_mb = EXCLUDED.max_storage_mb,
  can_export_docx = EXCLUDED.can_export_docx,
  can_export_pdf = EXCLUDED.can_export_pdf,
  can_export_pptx = EXCLUDED.can_export_pptx,
  can_use_ai_review = EXCLUDED.can_use_ai_review,
  can_use_defense_presentation = EXCLUDED.can_use_defense_presentation,
  updated_at = NOW();

-- 6. Update handle_new_user() Trigger Function to Snapshot Trial Entitlements
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_education_level TEXT;
  v_subject_group TEXT;
  v_school_name TEXT;
  v_sub_id UUID;
  v_trial_plan public.plans%ROWTYPE;
BEGIN
  -- Extract metadata
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_education_level := COALESCE(NEW.raw_user_meta_data->>'education_level', 'SECONDARY');
  v_subject_group := COALESCE(NEW.raw_user_meta_data->>'subject_group', 'MATH');
  v_school_name := COALESCE(NEW.raw_user_meta_data->>'school_name', '');

  -- 1. Create Profile
  INSERT INTO public.profiles (
    id, email, full_name, role, education_level, subject_group, school_name, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, 'user', v_education_level, v_subject_group, v_school_name, NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Fetch Trial Plan configuration
  SELECT * INTO v_trial_plan FROM public.plans WHERE code = 'TRIAL' LIMIT 1;

  -- 3. Create Subscription
  v_sub_id := gen_random_uuid();
  INSERT INTO public.subscriptions (
    id, user_id, plan_code, status,
    trial_started_at, trial_expires_at,
    started_at, expires_at,
    max_projects, created_at, updated_at
  )
  VALUES (
    v_sub_id,
    NEW.id,
    'TRIAL',
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '3 days',
    NOW(),
    NOW() + INTERVAL '3 days',
    COALESCE(v_trial_plan.max_projects, 1),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Create Snapshot Entitlements for this Subscription
  IF v_trial_plan.id IS NOT NULL THEN
    INSERT INTO public.subscription_entitlements (subscription_id, feature_code, allowed, limit_value)
    VALUES
      (v_sub_id, 'DASHBOARD_ACCESS', TRUE, NULL),
      (v_sub_id, 'PROFILE_ACCESS', TRUE, NULL),
      (v_sub_id, 'CREATE_PROJECT', TRUE, v_trial_plan.max_projects),
      (v_sub_id, 'AI_GENERATE', TRUE, v_trial_plan.max_ai_requests),
      (v_sub_id, 'AI_TOKEN_QUOTA', TRUE, v_trial_plan.max_ai_tokens),
      (v_sub_id, 'UPLOAD_FILE', TRUE, v_trial_plan.max_storage_mb),
      (v_sub_id, 'AI_REVIEW', v_trial_plan.can_use_ai_review, NULL),
      (v_sub_id, 'EXPORT_DOCX', v_trial_plan.can_export_docx, NULL),
      (v_sub_id, 'EXPORT_PDF', v_trial_plan.can_export_pdf, NULL),
      (v_sub_id, 'EXPORT_PPTX', v_trial_plan.can_export_pptx, NULL),
      (v_sub_id, 'DEFENSE_PRESENTATION', v_trial_plan.can_use_defense_presentation, NULL);
  END IF;

  -- 5. Record Audit Log
  INSERT INTO public.audit_logs (
    id, user_id, action, entity_type, entity_id, payload, created_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'USER_REGISTERED_TRIAL_INITIALIZED',
    'USER',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'plan_code', 'TRIAL',
      'trial_duration_days', 3,
      'trial_expires_at', (NOW() + INTERVAL '3 days')
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR PHASE 2 TABLES
-- ----------------------------------------------------------------------------

-- A. plans table: Anyone authenticated or public can read active plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (status = 'ACTIVE');

-- B. subscription_entitlements: Users can view entitlements of their own subscriptions
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription entitlements" ON public.subscription_entitlements;
CREATE POLICY "Users can view own subscription entitlements"
  ON public.subscription_entitlements FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
    )
  );

-- C. usage_ledger: Users can view own usage, only server role can write
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage ledger" ON public.usage_ledger;
CREATE POLICY "Users can view own usage ledger"
  ON public.usage_ledger FOR SELECT
  USING (user_id = auth.uid());

-- D. upgrade_requests: Users can view and create their own upgrade requests
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Users can view own upgrade requests"
  ON public.upgrade_requests FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Users can insert own upgrade requests"
  ON public.upgrade_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
