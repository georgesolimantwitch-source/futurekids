-- =============================================================================
-- Future Kids — Stripe billing extensions (additive)
-- Run AFTER 20260712110000_ecosystem_shared_auth.sql
-- Does not modify or drop TinyPal tables.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- profiles — account type + Stripe customer
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text
    CHECK (account_type IS NULL OR account_type IN ('parent', 'individual'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- subscriptions — Stripe + billing fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- app_access — access source + expiry
-- ---------------------------------------------------------------------------
ALTER TABLE public.app_access
  ADD COLUMN IF NOT EXISTS access_source text;

ALTER TABLE public.app_access
  ADD COLUMN IF NOT EXISTS subscription_id uuid
    REFERENCES public.subscriptions (id) ON DELETE SET NULL;

ALTER TABLE public.app_access
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.app_access
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

DROP TRIGGER IF EXISTS set_app_access_updated_at ON public.app_access;
CREATE TRIGGER set_app_access_updated_at
BEFORE UPDATE ON public.app_access
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Update provisioning to store account_type
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
    nullif(trim(NEW.raw_user_meta_data->>'account_type'), ''),
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

-- Server-only: attach Stripe customer (checkout / webhook)
CREATE OR REPLACE FUNCTION public.set_profile_stripe_customer_id(
  p_user_id uuid,
  p_stripe_customer_id text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF p_user_id IS NULL OR nullif(trim(p_stripe_customer_id), '') IS NULL THEN
    RAISE EXCEPTION 'user_id and stripe_customer_id are required';
  END IF;

  UPDATE public.profiles
  SET
    stripe_customer_id = trim(p_stripe_customer_id),
    updated_at = timezone('utc', now())
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_stripe_customer_id(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_stripe_customer_id(uuid, text) TO service_role;

COMMIT;
