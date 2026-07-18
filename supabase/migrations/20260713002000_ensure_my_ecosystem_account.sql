-- =============================================================================
-- Future Kids — authenticated self-provisioning (no service role required)
-- =============================================================================
-- Lets signed-in users repair missing profile/family/app_access rows via RPC.
-- Run after provision_ecosystem_account exists (20260713001000 or earlier).
-- =============================================================================

BEGIN;

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

  RETURN public.get_ecosystem_account();
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_ecosystem_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_ecosystem_account() TO authenticated;

COMMIT;
