-- Centralized, provider-verified subscription ledger and effective entitlements.
-- Additive: legacy subscriptions/app_access remain for compatibility but are no
-- longer authoritative for access.
BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('apple', 'google', 'stripe')),
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  environment text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_key text,
  payload jsonb NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT provider_subscription_events_unique UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS public.provider_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('apple', 'google', 'stripe')),
  source_key text NOT NULL,
  app_key text NOT NULL CHECK (app_key IN ('earnly', 'scholars', 'ballr', 'tinypal', 'all_access')),
  plan_key text NOT NULL,
  product_id text NOT NULL,
  environment text,
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'grace_period', 'inactive')),
  current_period_end timestamptz,
  child_limit integer NOT NULL DEFAULT 1 CHECK (child_limit BETWEEN 1 AND 100),
  provider_customer_id text,
  provider_latest_event_id text,
  app_account_token uuid,
  raw_verified_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  last_verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT provider_subscriptions_unique_source UNIQUE (provider, source_key)
);

CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_key text NOT NULL CHECK (app_key IN ('earnly', 'scholars', 'ballr', 'tinypal')),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'grace_period', 'inactive')),
  provider text NOT NULL CHECK (provider IN ('apple', 'google', 'stripe', 'none')),
  plan_key text,
  current_period_end timestamptz,
  child_limit integer NOT NULL DEFAULT 0 CHECK (child_limit BETWEEN 0 AND 100),
  source_owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_provider_subscription_id uuid REFERENCES public.provider_subscriptions(id) ON DELETE SET NULL,
  source_key text,
  first_granted_at timestamptz,
  last_recomputed_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT user_entitlements_unique_user_app UNIQUE (user_id, app_key),
  CONSTRAINT user_entitlements_active_has_source CHECK (
    status = 'inactive'
    OR (
      source_owner_id IS NOT NULL
      AND source_provider_subscription_id IS NOT NULL
      AND current_period_end IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS provider_events_source_idx
  ON public.provider_subscription_events(provider, source_key);
CREATE INDEX IF NOT EXISTS provider_events_user_idx
  ON public.provider_subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_subscriptions_user_idx
  ON public.provider_subscriptions(user_id, status, current_period_end DESC);
CREATE INDEX IF NOT EXISTS provider_subscriptions_customer_idx
  ON public.provider_subscriptions(provider, provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_entitlements_direct_read_idx
  ON public.user_entitlements(user_id, app_key, status, current_period_end DESC);
CREATE INDEX IF NOT EXISTS user_entitlements_source_owner_idx
  ON public.user_entitlements(source_owner_id);

DROP TRIGGER IF EXISTS set_provider_subscriptions_updated_at ON public.provider_subscriptions;
CREATE TRIGGER set_provider_subscriptions_updated_at
BEFORE UPDATE ON public.provider_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_entitlements_updated_at ON public.user_entitlements;
CREATE TRIGGER set_user_entitlements_updated_at
BEFORE UPDATE ON public.user_entitlements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rebuild all app rows granted by one purchaser. Re-running with the same
-- provider ledger produces the same effective result.
CREATE OR REPLACE FUNCTION public.recompute_user_entitlements(p_user_id uuid)
RETURNS SETOF public.user_entitlements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  -- Expire previous grants from this purchaser before rebuilding the winners.
  UPDATE public.user_entitlements
  SET status = 'inactive',
      provider = 'none',
      plan_key = NULL,
      current_period_end = NULL,
      child_limit = 0,
      source_provider_subscription_id = NULL,
      source_key = NULL,
      last_recomputed_at = timezone('utc', now())
  WHERE source_owner_id = p_user_id;

  WITH covered_users AS (
    SELECT p_user_id AS user_id
    UNION
    SELECT fm.user_id
    FROM public.families f
    JOIN public.family_members fm ON fm.family_id = f.id
    WHERE f.owner_id = p_user_id
      AND lower(fm.role::text) = 'child'
  ),
  source_rows AS (
    SELECT ps.*
    FROM public.provider_subscriptions ps
    WHERE ps.user_id = p_user_id
      AND ps.status IN ('active', 'trialing', 'grace_period')
      AND ps.current_period_end > timezone('utc', now())
  ),
  expanded AS (
    SELECT
      cu.user_id,
      apps.app_key,
      sr.*,
      row_number() OVER (
        PARTITION BY cu.user_id, apps.app_key
        ORDER BY
          CASE sr.status WHEN 'active' THEN 1 WHEN 'trialing' THEN 2 ELSE 3 END,
          sr.current_period_end DESC,
          sr.last_verified_at DESC
      ) AS winner
    FROM source_rows sr
    CROSS JOIN covered_users cu
    CROSS JOIN LATERAL (
      SELECT unnest(
        CASE
          WHEN sr.app_key = 'all_access'
            THEN ARRAY['earnly', 'scholars', 'ballr', 'tinypal']::text[]
          ELSE ARRAY[sr.app_key]::text[]
        END
      ) AS app_key
    ) apps
  )
  INSERT INTO public.user_entitlements (
    user_id,
    app_key,
    status,
    provider,
    plan_key,
    current_period_end,
    child_limit,
    source_owner_id,
    source_provider_subscription_id,
    source_key,
    first_granted_at,
    last_recomputed_at
  )
  SELECT
    e.user_id,
    e.app_key,
    e.status,
    e.provider,
    e.plan_key,
    e.current_period_end,
    e.child_limit,
    p_user_id,
    e.id,
    e.source_key,
    timezone('utc', now()),
    timezone('utc', now())
  FROM expanded e
  WHERE e.winner = 1
  ON CONFLICT (user_id, app_key) DO UPDATE
  SET status = EXCLUDED.status,
      provider = EXCLUDED.provider,
      plan_key = EXCLUDED.plan_key,
      current_period_end = EXCLUDED.current_period_end,
      child_limit = EXCLUDED.child_limit,
      source_owner_id = EXCLUDED.source_owner_id,
      source_provider_subscription_id = EXCLUDED.source_provider_subscription_id,
      source_key = EXCLUDED.source_key,
      first_granted_at = COALESCE(public.user_entitlements.first_granted_at, EXCLUDED.first_granted_at),
      last_recomputed_at = EXCLUDED.last_recomputed_at;

  RETURN QUERY
  SELECT ue.*
  FROM public.user_entitlements ue
  WHERE ue.user_id = p_user_id
     OR ue.source_owner_id = p_user_id
  ORDER BY ue.user_id, ue.app_key;
END;
$$;

-- Login telemetry must never manufacture access. It mirrors only a currently
-- effective canonical entitlement.
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
  v_has_access boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_entitlements ue
    WHERE ue.user_id = auth.uid()
      AND ue.app_key = p_app_name::text
      AND ue.status IN ('active', 'trialing', 'grace_period')
      AND ue.current_period_end > timezone('utc', now())
  ) INTO v_has_access;

  INSERT INTO public.app_access (user_id, app_name, has_access, last_login)
  VALUES (auth.uid(), p_app_name, v_has_access, timezone('utc', now()))
  ON CONFLICT (user_id, app_name) DO UPDATE
  SET has_access = EXCLUDED.has_access,
      last_login = EXCLUDED.last_login
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

ALTER TABLE public.provider_subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_entitlements_select_own ON public.user_entitlements;
CREATE POLICY user_entitlements_select_own
ON public.user_entitlements FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- No authenticated policies exist on provider tables or entitlement writes.
-- Only service_role bypasses RLS and can mutate verified billing state.
REVOKE ALL ON public.provider_subscription_events FROM anon, authenticated;
REVOKE ALL ON public.provider_subscriptions FROM anon, authenticated;
REVOKE ALL ON public.user_entitlements FROM anon, authenticated;
GRANT SELECT ON public.user_entitlements TO authenticated;
GRANT ALL ON public.provider_subscription_events TO service_role;
GRANT ALL ON public.provider_subscriptions TO service_role;
GRANT ALL ON public.user_entitlements TO service_role;

REVOKE ALL ON FUNCTION public.recompute_user_entitlements(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_user_entitlements(uuid) TO service_role;

-- Keep profile editing but remove client writes to server-owned billing fields.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (email, full_name, avatar_url, account_type) ON public.profiles TO authenticated;

COMMIT;

-- SQL smoke assertions after applying:
-- 1) SET LOCAL ROLE authenticated; SELECT * FROM public.user_entitlements;
--    only auth.uid() rows are visible.
-- 2) authenticated INSERT/UPDATE/DELETE on user_entitlements and all access to
--    provider_* tables fail.
-- 3) An expired provider_subscriptions row followed by
--    recompute_user_entitlements(user_id) yields no effective active row.
-- 4) all_access yields four app rows for the owner and linked child members.
