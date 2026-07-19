begin;

create or replace function public.has_app_access(p_app_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with strongest as (
    select ue.*
    from public.user_entitlements ue
    where ue.user_id = auth.uid()
      and ue.app_key in (p_app_key, 'futurekids_all_access')
      and ue.status in ('active', 'trialing', 'grace_period', 'canceled')
      and (ue.current_period_end is null or ue.current_period_end > timezone('utc', now()))
    ORDER BY
      ue.entitlement_rank DESC,
      ue.child_limit DESC NULLS LAST,
      ue.current_period_end DESC NULLS FIRST
    limit 1
  )
  select case
    when exists (select 1 from strongest) then (
      select jsonb_build_object(
        'hasAccess', true,
        'appKey', p_app_key,
        'planKey', strongest.plan_key,
        'tierKey', strongest.tier_key,
        'features', strongest.features,
        'limits', strongest.limits,
        'childLimit', strongest.child_limit,
        'provider', strongest.provider,
        'status', strongest.status,
        'currentPeriodEnd', strongest.current_period_end,
        'manageWith', case
          when strongest.provider = 'stripe' then 'stripe'
          when strongest.provider = 'apple' then 'app_store'
          else strongest.provider
        end
      )
      from strongest
    )
    else jsonb_build_object(
      'hasAccess', false,
      'appKey', p_app_key,
      'planKey', null,
      'tierKey', 'none',
      'features', '{}'::jsonb,
      'limits', '{}'::jsonb,
      'childLimit', null,
      'provider', null,
      'status', null,
      'currentPeriodEnd', null,
      'manageWith', null
    )
  end;
$$;

revoke all on function public.has_app_access(text) from public, anon;
grant execute on function public.has_app_access(text) to authenticated;

commit;
