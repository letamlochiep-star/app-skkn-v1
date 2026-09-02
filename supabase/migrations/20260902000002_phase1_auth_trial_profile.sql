-- ============================================================================
-- SKKN AI PHASE 1 MIGRATION: AUTH, PROFILE, 3-DAY TRIAL & STRICT RLS POLICIES
-- ============================================================================

-- Function: Automatically create Profile and 3-Day Trial Subscription upon User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_education_level TEXT;
  v_subject_group TEXT;
  v_school_name TEXT;
BEGIN
  -- Extract metadata from user registration
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_education_level := COALESCE(NEW.raw_user_meta_data->>'education_level', 'SECONDARY');
  v_subject_group := COALESCE(NEW.raw_user_meta_data->>'subject_group', 'MATH');
  v_school_name := COALESCE(NEW.raw_user_meta_data->>'school_name', '');

  -- 1. Create User Profile (Default role is strictly 'user')
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    education_level,
    subject_group,
    school_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    'user',
    v_education_level,
    v_subject_group,
    v_school_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Initialize 3-Day Server-Enforced Trial (3 days from server NOW())
  INSERT INTO public.subscriptions (
    id,
    user_id,
    plan_code,
    status,
    trial_started_at,
    trial_expires_at,
    started_at,
    expires_at,
    max_projects,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'FREE_TRIAL',
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '3 days',
    NOW(),
    NOW() + INTERVAL '3 days',
    3,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Record Audit Log for Signup Event
  INSERT INTO public.audit_logs (
    id,
    user_id,
    action,
    entity_type,
    entity_id,
    payload,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'USER_REGISTERED_TRIAL_INITIALIZED',
    'USER',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'trial_duration_days', 3,
      'trial_expires_at', (NOW() + INTERVAL '3 days')
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users after insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- STRICT SECURITY TRIGGER: PREVENT REGULAR USERS FROM ELEVATING ROLE TO ADMIN
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role_elevation()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being modified, ensure caller is service_role or admin
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
      RAISE EXCEPTION 'FORBIDDEN: You do not have permission to change user role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_elevation();

-- ----------------------------------------------------------------------------
-- STRICT RLS ON SUBSCRIPTIONS: USERS CAN NEVER INSERT/UPDATE/DELETE SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
-- Drop any previous update policy on subscriptions for regular users
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;

-- Only SELECT is permitted for users on subscriptions
CREATE POLICY "Users can only view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
