-- Future Kids (nepmwdctmilbsgbmiyea)
-- Fix: website / ecosystem self-provision never set account_setup_complete,
-- so Earnly (and TinyPal) rejected real Future Kids accounts after Google/email login.
--
-- Rules:
-- - Auth trigger + provision_ecosystem_account still leave the flag false
--   (bare in-app Google OAuth alone is not "account ready").
-- - ensure_my_ecosystem_account (website /account/setup) marks complete = true.
-- - Backfill existing real profiles so already-created website users can sign in.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_setup_complete boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.account_setup_complete IS
  'True after Future Kids website/onboarding setup completes (ensure_my_ecosystem_account). Auth trigger auto-provision stays false until then.';

CREATE OR REPLACE FUNCTION public.ensure_my_ecosystem_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_full_name text;
  v_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.email, u.raw_user_meta_data
  INTO v_email, v_meta
  FROM auth.users u
  WHERE u.id = v_user_id;

  v_full_name := coalesce(
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(concat_ws(' ',
      v_meta->>'first_name',
      v_meta->>'last_name'
    )), ''),
    nullif(split_part(coalesce(v_email, ''), '@', 1), '')
  );

  v_role := coalesce(
    nullif(trim(v_meta->>'account_type'), ''),
    nullif(trim(v_meta->>'ecosystem_role'), ''),
    nullif(trim(v_meta->>'role'), ''),
    nullif(trim(v_meta->>'account_role'), ''),
    'parent'
  );

  PERFORM public.provision_ecosystem_account(
    v_user_id,
    coalesce(v_email, ''),
    v_full_name,
    coalesce(v_meta->>'avatar_url', v_meta->>'picture'),
    v_role,
    v_meta->>'family_name'
  );

  -- Website /account/setup and authenticated self-repair complete the account.
  UPDATE public.profiles
  SET
    account_setup_complete = true,
    updated_at = timezone('utc', now())
  WHERE id = v_user_id
    AND account_setup_complete IS DISTINCT FROM true;

  RETURN public.get_ecosystem_account();
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_ecosystem_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_ecosystem_account() TO authenticated;

-- Explicit helper for clients that already provisioned and only need to mark ready.
CREATE OR REPLACE FUNCTION public.complete_my_account_setup()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    PERFORM public.ensure_my_ecosystem_account();
  END IF;

  UPDATE public.profiles
  SET
    account_setup_complete = true,
    updated_at = timezone('utc', now())
  WHERE id = v_user_id;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_user_id
      AND account_setup_complete = true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_my_account_setup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_my_account_setup() TO authenticated;

-- Backfill: real ecosystem profiles created before this fix (website signup users).
-- Skip synthetic / internal emails used for child accounts.
UPDATE public.profiles p
SET
  account_setup_complete = true,
  updated_at = timezone('utc', now())
WHERE p.account_setup_complete = false
  AND p.email IS NOT NULL
  AND p.email NOT ILIKE '%@users.futurekids.internal'
  AND p.email NOT ILIKE '%@users.local'
  AND nullif(trim(p.full_name), '') IS NOT NULL
  AND coalesce(p.account_type, 'parent') IN ('parent', 'individual');

COMMIT;
