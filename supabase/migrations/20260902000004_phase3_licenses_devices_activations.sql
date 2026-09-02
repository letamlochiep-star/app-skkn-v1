-- ============================================================================
-- SKKN AI PHASE 3 MIGRATION: LICENSES, DEVICES & ACTIVATIONS
-- ============================================================================

-- 1. Table: devices
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_hash TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Thiết bị chưa đặt tên',
  browser TEXT,
  os TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'REVOKED' | 'BLOCKED'
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_device_hash UNIQUE(user_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_hash ON public.devices(device_hash);

-- 2. Table: licenses
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  license_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ISSUED', -- 'ISSUED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED'
  max_devices INTEGER NOT NULL DEFAULT 2,
  activation_count INTEGER NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_user ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_hash ON public.licenses(license_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);

-- 3. Table: license_activations
CREATE TABLE IF NOT EXISTS public.license_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'DEACTIVATED' | 'REVOKED'
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_license_device UNIQUE(license_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_activations_license ON public.license_activations(license_id);
CREATE INDEX IF NOT EXISTS idx_activations_user ON public.license_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_activations_device ON public.license_activations(device_id);

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR PHASE 3
-- ----------------------------------------------------------------------------

-- A. devices table: Users can view own devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
CREATE POLICY "Users can view own devices"
  ON public.devices FOR SELECT
  USING (user_id = auth.uid());

-- B. licenses table: Users can view own licenses
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
CREATE POLICY "Users can view own licenses"
  ON public.licenses FOR SELECT
  USING (user_id = auth.uid());

-- C. license_activations table: Users can view own activations
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own activations" ON public.license_activations;
CREATE POLICY "Users can view own activations"
  ON public.license_activations FOR SELECT
  USING (user_id = auth.uid());
