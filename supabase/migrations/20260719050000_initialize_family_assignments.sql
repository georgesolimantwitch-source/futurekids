begin;

create or replace function public.initialize_entitlement_child_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
begin
  if new.app_key not in ('earnly', 'futurekids_all_access')
     or new.child_limit is null
     or new.status not in ('active', 'trialing', 'grace_period', 'canceled')
     or (new.current_period_end is not null and new.current_period_end <= timezone('utc', now()))
     or exists (
       select 1 from public.user_entitlement_children assignment
       where assignment.entitlement_id = new.id
     ) then
    return new;
  end if;

  select family.id into v_family_id
  from public.families family
  where family.owner_id = new.user_id
  order by family.created_at
  limit 1;

  insert into public.user_entitlement_children (entitlement_id, child_id)
  select new.id, member.user_id
  from public.family_members member
  where member.family_id = v_family_id
    and member.role::text = 'child'
  order by member.joined_at, member.user_id
  limit new.child_limit
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists initialize_entitlement_child_assignments
  on public.user_entitlements;
create trigger initialize_entitlement_child_assignments
after insert or update of child_limit, status, current_period_end
on public.user_entitlements
for each row execute function public.initialize_entitlement_child_assignments();

insert into public.user_entitlement_children (entitlement_id, child_id)
select entitlement.id, selected.user_id
from public.user_entitlements entitlement
cross join lateral (
  select member.user_id
  from public.families family
  join public.family_members member on member.family_id = family.id
  where family.owner_id = entitlement.user_id
    and member.role::text = 'child'
  order by family.created_at, member.joined_at, member.user_id
  limit entitlement.child_limit
) selected
where entitlement.app_key in ('earnly', 'futurekids_all_access')
  and entitlement.child_limit is not null
  and entitlement.status in ('active', 'trialing', 'grace_period', 'canceled')
  and (
    entitlement.current_period_end is null
    or entitlement.current_period_end > timezone('utc', now())
  )
  and not exists (
    select 1 from public.user_entitlement_children existing
    where existing.entitlement_id = entitlement.id
  )
on conflict do nothing;

do $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct entitlement.user_id
    from public.user_entitlements entitlement
    where entitlement.app_key in ('earnly', 'futurekids_all_access')
  loop
    perform public.recompute_family_child_app_access(v_user_id, 'earnly');
  end loop;
end;
$$;

revoke all on function public.initialize_entitlement_child_assignments()
  from public, anon, authenticated;

commit;
