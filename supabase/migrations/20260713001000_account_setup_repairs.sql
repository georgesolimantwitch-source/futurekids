-- =============================================================================
-- Future Kids — account setup repair (self-contained)
-- =============================================================================
-- Safe to run even if 20260712120000 was skipped. Creates/replaces the
-- provisioning function and grants service_role execute access.
-- Requires 20260712110000_ecosystem_shared_auth.sql to have been applied first.
-- =============================================================================

BEGIN;

-- Optional columns from stripe billing migration (no-op if already present)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text
    CHECK (account_type IS NULL OR account_type IN ('parent', 'individual'));

ALTER TABLE public.app_access
  ADD COLUMN IF NOT EXISTS access_source text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe';

-- Idempotent account provisioning (used by signup trigger + /api/account/setup)
CREATE OR REPLACE FUNCTION public.provision_ecosystem_account(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_family_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := lower(coalesce(nullif(trim(p_role), ''), 'parent'));
  v_account_type text;
  v_full_name text := nullif(trim(p_full_name), '');
  v_family_name text;
  v_family_id uuid;
  v_app public.ecosystem_app_name;
BEGIN
  v_account_type := CASE
    WHEN v_role IN ('individual', 'child') THEN 'individual'
    ELSE 'parent'
  END;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, account_type)
  VALUES (
    p_user_id,
    coalesce(nullif(trim(p_email), ''), 'unknown@users.local'),
    v_full_name,
    nullif(trim(p_avatar_url), ''),
    v_account_type
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    account_type = COALESCE(EXCLUDED.account_type, public.profiles.account_type),
    updated_at = timezone('utc', now());

  FOREACH v_app IN ARRAY ARRAY[
    'tinypal'::public.ecosystem_app_name,
    'earnly'::public.ecosystem_app_name,
    'scholars'::public.ecosystem_app_name,
    'ballr'::public.ecosystem_app_name
  ] LOOP
    INSERT INTO public.app_access (user_id, app_name, has_access, access_source)
    VALUES (p_user_id, v_app, false, 'none')
    ON CONFLICT (user_id, app_name) DO NOTHING;

    INSERT INTO public.subscriptions (user_id, app_name, subscription_status, provider)
    VALUES (p_user_id, v_app, 'none', 'stripe')
    ON CONFLICT (user_id, app_name) DO NOTHING;
  END LOOP;

  IF v_account_type = 'parent'
     AND NOT EXISTS (
       SELECT 1 FROM public.family_members fm WHERE fm.user_id = p_user_id
     ) THEN
    v_family_name := coalesce(
      nullif(trim(p_family_name), ''),
      CASE
        WHEN v_full_name IS NOT NULL THEN v_full_name || '''s Family'
        ELSE 'My Family'
      END
    );

    INSERT INTO public.families (owner_id, family_name)
    VALUES (p_user_id, v_family_name)
    RETURNING id INTO v_family_id;

    INSERT INTO public.family_members (family_id, user_id, role)
    VALUES (v_family_id, p_user_id, 'parent'::public.account_role);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_ecosystem_account(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_ecosystem_account(uuid, text, text, text, text, text) TO service_role;

COMMIT;
