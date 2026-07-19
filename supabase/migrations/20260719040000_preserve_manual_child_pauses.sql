begin;

create or replace function public.recompute_family_child_app_access(
  p_user_id uuid,
  p_app_key text default 'earnly'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
begin
  select family.id into v_family_id
  from public.families family
  where family.owner_id = p_user_id
  order by family.created_at
  limit 1;

  if v_family_id is null then
    return;
  end if;

  insert into public.family_child_app_access (
    family_id,
    child_id,
    app_key,
    status,
    status_reason,
    source_entitlement_id,
    activated_at,
    paused_at,
    updated_at
  )
  select
    v_family_id,
    member.user_id,
    p_app_key,
    case when access.entitlement_id is not null then 'active' else 'paused_by_plan' end,
    case when access.entitlement_id is not null then null else 'child_limit' end,
    access.entitlement_id,
    case when access.entitlement_id is not null then timezone('utc', now()) else null end,
    case when access.entitlement_id is null then timezone('utc', now()) else null end,
    timezone('utc', now())
  from public.family_members member
  left join lateral (
    select entitlement.id as entitlement_id
    from public.user_entitlements entitlement
    where entitlement.user_id = p_user_id
      and entitlement.app_key in (p_app_key, 'futurekids_all_access')
      and entitlement.status in ('active', 'trialing', 'grace_period', 'canceled')
      and (
        entitlement.current_period_end is null
        or entitlement.current_period_end > timezone('utc', now())
      )
      and (
        not exists (
          select 1 from public.user_entitlement_children any_assignment
          where any_assignment.entitlement_id = entitlement.id
        )
        or exists (
          select 1 from public.user_entitlement_children assignment
          where assignment.entitlement_id = entitlement.id
            and assignment.child_id = member.user_id
        )
      )
    order by
      entitlement.entitlement_rank desc,
      entitlement.child_limit desc nulls last
    limit 1
  ) access on true
  where member.family_id = v_family_id
    and member.role::text = 'child'
  on conflict (family_id, child_id, app_key) do update set
    status = case
      when public.family_child_app_access.status in ('paused_by_parent', 'revoked')
        then public.family_child_app_access.status
      else excluded.status
    end,
    status_reason = case
      when public.family_child_app_access.status in ('paused_by_parent', 'revoked')
        then public.family_child_app_access.status_reason
      else excluded.status_reason
    end,
    source_entitlement_id = case
      when public.family_child_app_access.status in ('paused_by_parent', 'revoked')
        then public.family_child_app_access.source_entitlement_id
      else excluded.source_entitlement_id
    end,
    activated_at = case
      when excluded.status = 'active'
        then coalesce(public.family_child_app_access.activated_at, excluded.activated_at)
      else public.family_child_app_access.activated_at
    end,
    paused_at = case
      when public.family_child_app_access.status in ('paused_by_parent', 'revoked')
        then public.family_child_app_access.paused_at
      else excluded.paused_at
    end,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.recompute_family_child_app_access(uuid, text)
  from public, anon, authenticated;
grant execute on function public.recompute_family_child_app_access(uuid, text)
  to service_role;

commit;
