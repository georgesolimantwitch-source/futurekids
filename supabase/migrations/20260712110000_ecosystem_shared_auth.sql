-- =============================================================================
-- Future Kids — Ecosystem shared authentication layer
-- =============================================================================
-- ADDITIVE ONLY: does not modify, rename, or drop any TinyPal tables.
-- TinyPal continues using parent_profiles, households, child_profiles, etc.
-- New tables power cross-app identity for TinyPal, Earnly, Scholars, and Ballr.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums (ecosystem-specific; TinyPal account_role reused for family_members)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.ecosystem_app_name AS ENUM (
    'tinypal',
    'earnly',
    'scholars',
    'ballr'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ecosystem_subscription_status AS ENUM (
    'none',
    'trialing',
    'active',
    'past_due',
    'cancelled',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1. profiles — unified account profile (auth.users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL CHECK (position('@' in email) > 1),
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
  ON public.profiles (lower(email));

CREATE INDEX IF NOT EXISTS profiles_created_at_idx
  ON public.profiles (created_at DESC);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. families — ecosystem family unit (distinct from TinyPal households)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name text NOT NULL CHECK (char_length(trim(family_name)) > 0),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS families_owner_id_idx
  ON public.families (owner_id);

-- ---------------------------------------------------------------------------
-- 3. family_members — links users to ecosystem families
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.account_role NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT family_members_unique_member UNIQUE (family_id, user_id)
);

CREATE INDEX IF NOT EXISTS family_members_user_id_idx
  ON public.family_members (user_id);

CREATE INDEX IF NOT EXISTS family_members_family_id_idx
  ON public.family_members (family_id);

-- ---------------------------------------------------------------------------
-- 4. subscriptions — per-app subscription state (central billing ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  app_name public.ecosystem_app_name NOT NULL,
  subscription_status public.ecosystem_subscription_status NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT subscriptions_unique_user_app UNIQUE (user_id, app_name)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS subscriptions_app_name_idx
  ON public.subscriptions (app_name);

-- ---------------------------------------------------------------------------
-- 5. app_access — per-app access + last login tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  app_name public.ecosystem_app_name NOT NULL,
  has_access boolean NOT NULL DEFAULT false,
  last_login timestamptz,
  CONSTRAINT app_access_unique_user_app UNIQUE (user_id, app_name)
);

CREATE INDEX IF NOT EXISTS app_access_user_id_idx
  ON public.app_access (user_id);

CREATE INDEX IF NOT EXISTS app_access_app_name_idx
  ON public.app_access (app_name);

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_ecosystem_user(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.user_family_ids(p_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.family_id
  FROM public.family_members fm
  WHERE fm.user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.user_owns_family(
  p_family_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.families f
    WHERE f.id = p_family_id
      AND f.owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_family_member(
  p_family_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = p_family_id
      AND fm.user_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Signup provisioning (auth.users trigger)
-- ---------------------------------------------------------------------------
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
  v_full_name text := nullif(trim(p_full_name), '');
  v_family_name text;
  v_family_id uuid;
  v_app public.ecosystem_app_name;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    p_user_id,
    coalesce(nullif(trim(p_email), ''), 'unknown@users.local'),
    v_full_name,
    nullif(trim(p_avatar_url), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc', now());

  FOREACH v_app IN ARRAY ARRAY[
    'tinypal'::public.ecosystem_app_name,
    'earnly'::public.ecosystem_app_name,
    'scholars'::public.ecosystem_app_name,
    'ballr'::public.ecosystem_app_name
  ] LOOP
    INSERT INTO public.app_access (user_id, app_name, has_access)
    VALUES (p_user_id, v_app, false)
    ON CONFLICT (user_id, app_name) DO NOTHING;

    INSERT INTO public.subscriptions (user_id, app_name, subscription_status)
    VALUES (p_user_id, v_app, 'none')
    ON CONFLICT (user_id, app_name) DO NOTHING;
  END LOOP;

  IF v_role = 'parent'
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

CREATE OR REPLACE FUNCTION public.handle_new_ecosystem_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_role text;
BEGIN
  v_full_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(concat_ws(' ',
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    )), ''),
    nullif(split_part(coalesce(NEW.email, ''), '@', 1), '')
  );

  v_role := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'ecosystem_role'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'role'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'account_role'), ''),
    'parent'
  );

  PERFORM public.provision_ecosystem_account(
    NEW.id,
    coalesce(NEW.email, ''),
    v_full_name,
    NEW.raw_user_meta_data->>'avatar_url',
    v_role,
    NEW.raw_user_meta_data->>'family_name'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_ecosystem ON auth.users;
CREATE TRIGGER on_auth_user_created_ecosystem
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_ecosystem_user();

-- Idempotent family ensure for parent accounts created before this migration
CREATE OR REPLACE FUNCTION public.ensure_ecosystem_family_for_parent(
  p_family_name text DEFAULT NULL
)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family public.families;
  v_full_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  SELECT u.id, coalesce(u.email, 'unknown@users.local'), NULL
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (id) DO NOTHING;

  SELECT f.*
  INTO v_family
  FROM public.families f
  WHERE f.owner_id = auth.uid()
  ORDER BY f.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_family;
  END IF;

  SELECT p.full_name INTO v_full_name FROM public.profiles p WHERE p.id = auth.uid();

  INSERT INTO public.families (owner_id, family_name)
  VALUES (
    auth.uid(),
    coalesce(
      nullif(trim(p_family_name), ''),
      CASE
        WHEN v_full_name IS NOT NULL THEN v_full_name || '''s Family'
        ELSE 'My Family'
      END
    )
  )
  RETURNING * INTO v_family;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family.id, auth.uid(), 'parent'::public.account_role)
  ON CONFLICT (family_id, user_id) DO NOTHING;

  RETURN v_family;
END;
$$;

-- Record app login (called by each app after successful auth)
CREATE OR REPLACE FUNCTION public.record_ecosystem_app_login(
  p_app_name public.ecosystem_app_name
)
RETURNS public.app_access
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.app_access;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.app_access (user_id, app_name, has_access, last_login)
  VALUES (auth.uid(), p_app_name, true, timezone('utc', now()))
  ON CONFLICT (user_id, app_name) DO UPDATE
  SET
    has_access = true,
    last_login = timezone('utc', now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Single RPC for satellite apps to fetch ecosystem account context
CREATE OR REPLACE FUNCTION public.get_ecosystem_account()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'user_id', v_user_id,
    'profile', (
      SELECT to_jsonb(p.*)
      FROM public.profiles p
      WHERE p.id = v_user_id
    ),
    'families', coalesce((
      SELECT jsonb_agg(to_jsonb(f.*) ORDER BY f.created_at)
      FROM public.families f
      WHERE f.owner_id = v_user_id
         OR f.id IN (SELECT public.user_family_ids(v_user_id))
    ), '[]'::jsonb),
    'family_members', coalesce((
      SELECT jsonb_agg(to_jsonb(fm.*) ORDER BY fm.joined_at)
      FROM public.family_members fm
      WHERE fm.family_id IN (SELECT public.user_family_ids(v_user_id))
         OR fm.user_id = v_user_id
    ), '[]'::jsonb),
    'subscriptions', coalesce((
      SELECT jsonb_agg(to_jsonb(s.*) ORDER BY s.app_name)
      FROM public.subscriptions s
      WHERE s.user_id = v_user_id
    ), '[]'::jsonb),
    'app_access', coalesce((
      SELECT jsonb_agg(to_jsonb(a.*) ORDER BY a.app_name)
      FROM public.app_access a
      WHERE a.user_id = v_user_id
    ), '[]'::jsonb),
    'tinypal_parent_profile_exists', EXISTS (
      SELECT 1 FROM public.parent_profiles pp WHERE pp.id = v_user_id
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Backfill existing auth users / TinyPal parent_profiles (non-destructive)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT
  pp.id,
  pp.email,
  trim(pp.first_name || ' ' || pp.last_name),
  pp.profile_photo_url
FROM public.parent_profiles pp
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
  updated_at = timezone('utc', now());

INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  coalesce(u.email, 'unknown@users.local'),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_access (user_id, app_name, has_access)
SELECT p.id, app.app_name, false
FROM public.profiles p
CROSS JOIN (
  SELECT unnest(ARRAY[
    'tinypal'::public.ecosystem_app_name,
    'earnly'::public.ecosystem_app_name,
    'scholars'::public.ecosystem_app_name,
    'ballr'::public.ecosystem_app_name
  ]) AS app_name
) app
ON CONFLICT (user_id, app_name) DO NOTHING;

INSERT INTO public.subscriptions (user_id, app_name, subscription_status)
SELECT p.id, app.app_name, 'none'::public.ecosystem_subscription_status
FROM public.profiles p
CROSS JOIN (
  SELECT unnest(ARRAY[
    'tinypal'::public.ecosystem_app_name,
    'earnly'::public.ecosystem_app_name,
    'scholars'::public.ecosystem_app_name,
    'ballr'::public.ecosystem_app_name
  ]) AS app_name
) app
ON CONFLICT (user_id, app_name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_access ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- families: owner or member can read; only owner inserts/updates/deletes
DROP POLICY IF EXISTS families_member_select ON public.families;
CREATE POLICY families_member_select
ON public.families FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR public.user_is_family_member(id, auth.uid())
);

DROP POLICY IF EXISTS families_owner_insert ON public.families;
CREATE POLICY families_owner_insert
ON public.families FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS families_owner_update ON public.families;
CREATE POLICY families_owner_update
ON public.families FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS families_owner_delete ON public.families;
CREATE POLICY families_owner_delete
ON public.families FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- family_members
DROP POLICY IF EXISTS family_members_related_select ON public.family_members;
CREATE POLICY family_members_related_select
ON public.family_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.user_is_family_member(family_id, auth.uid())
  OR public.user_owns_family(family_id, auth.uid())
);

DROP POLICY IF EXISTS family_members_owner_insert ON public.family_members;
CREATE POLICY family_members_owner_insert
ON public.family_members FOR INSERT TO authenticated
WITH CHECK (public.user_owns_family(family_id, auth.uid()));

DROP POLICY IF EXISTS family_members_owner_update ON public.family_members;
CREATE POLICY family_members_owner_update
ON public.family_members FOR UPDATE TO authenticated
USING (public.user_owns_family(family_id, auth.uid()))
WITH CHECK (public.user_owns_family(family_id, auth.uid()));

DROP POLICY IF EXISTS family_members_owner_delete ON public.family_members;
CREATE POLICY family_members_owner_delete
ON public.family_members FOR DELETE TO authenticated
USING (public.user_owns_family(family_id, auth.uid()));

-- subscriptions: own rows only
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own
ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS subscriptions_no_client_write ON public.subscriptions;
CREATE POLICY subscriptions_no_client_write
ON public.subscriptions FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- app_access: read own; update own last_login/has_access via RPC only for writes from client
DROP POLICY IF EXISTS app_access_select_own ON public.app_access;
CREATE POLICY app_access_select_own
ON public.app_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS app_access_no_direct_write ON public.app_access;
CREATE POLICY app_access_no_direct_write
ON public.app_access FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS app_access_no_direct_update ON public.app_access;
CREATE POLICY app_access_no_direct_update
ON public.app_access FOR UPDATE TO authenticated
USING (false);

DROP POLICY IF EXISTS app_access_no_direct_delete ON public.app_access;
CREATE POLICY app_access_no_direct_delete
ON public.app_access FOR DELETE TO authenticated
USING (false);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.app_access TO authenticated;

REVOKE ALL ON FUNCTION public.provision_ecosystem_account(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_ecosystem_family_for_parent(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_ecosystem_app_login(public.ecosystem_app_name) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ecosystem_account() TO authenticated;

COMMIT;
