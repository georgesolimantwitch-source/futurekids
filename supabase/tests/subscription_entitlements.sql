-- Run against a migrated disposable database:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/subscription_entitlements.sql
BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.user_entitlements'::regclass
  ), 'user_entitlements must have RLS enabled';

  ASSERT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.subscription_provider_events'::regclass
  ), 'provider event receipts must have RLS enabled';

  ASSERT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_entitlements'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE '%provider, provider_subscription_id%'
  ), 'provider subscription identity must be unique';

  ASSERT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.subscription_provider_events'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE '%provider, provider_event_id%'
  ), 'provider event delivery must be idempotent';

  ASSERT has_table_privilege(
    'authenticated',
    'public.user_entitlements',
    'SELECT'
  ), 'authenticated users need their RLS-scoped entitlement reads';
  ASSERT NOT has_table_privilege(
    'authenticated',
    'public.user_entitlements',
    'INSERT'
  ), 'authenticated users must not insert entitlements';
  ASSERT NOT has_table_privilege(
    'authenticated',
    'public.user_entitlements',
    'UPDATE'
  ), 'authenticated users must not update entitlements';
  ASSERT NOT has_table_privilege(
    'authenticated',
    'public.user_entitlements',
    'DELETE'
  ), 'authenticated users must not delete entitlements';
  ASSERT NOT has_table_privilege(
    'authenticated',
    'public.subscription_provider_events',
    'SELECT'
  ), 'provider event receipts must remain server-only';

  ASSERT has_function_privilege(
    'authenticated',
    'public.has_app_access(text)',
    'EXECUTE'
  ), 'authenticated apps must be able to check access';
  ASSERT NOT has_function_privilege(
    'anon',
    'public.has_app_access(text)',
    'EXECUTE'
  ), 'anonymous callers must not check account access';
  ASSERT position(
    'futurekids_all_access'
    IN pg_get_functiondef('public.has_app_access(text)'::regprocedure)
  ) > 0, 'access RPC must honor All Access';
  ASSERT position(
    'ue.entitlement_rank DESC'
    IN pg_get_functiondef('public.has_app_access(text)'::regprocedure)
  ) > 0, 'effective access must prefer the strongest entitlement';
  ASSERT position(
    'auth.uid()'
    IN pg_get_functiondef('public.has_app_access(text)'::regprocedure)
  ) > 0, 'access RPC must derive the user from the authenticated session';
  ASSERT has_function_privilege(
    'authenticated',
    'public.get_effective_app_access()',
    'EXECUTE'
  ), 'authenticated apps may read normalized access';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public.apply_subscription_provider_event(text,text,text,text,timestamptz,uuid,text,text,text,text,text,text,text,integer,integer,jsonb,jsonb,text,timestamptz,timestamptz,boolean,integer,text,text,boolean,text)',
    'EXECUTE'
  ), 'only the service role may apply provider events';
  ASSERT position(
    '''entitlements'''
    IN pg_get_functiondef('public.get_ecosystem_account()'::regprocedure)
  ) > 0, 'account RPC must include authoritative entitlements';

  ASSERT NOT has_column_privilege(
    'authenticated',
    'public.profiles',
    'stripe_customer_id',
    'UPDATE'
  ), 'clients must not update Stripe customer linkage';
END;
$$;

ROLLBACK;
