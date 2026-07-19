begin;

create table if not exists public.subscription_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  event_subtype text,
  user_id uuid references auth.users(id) on delete set null,
  provider_subscription_id text,
  current_transaction_id text,
  original_transaction_id text,
  environment text,
  occurred_at timestamptz,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  outcome text,
  attempts integer not null default 1,
  payload_hash text,
  error_message text,
  constraint subscription_provider_events_provider_event_unique
    unique (provider, provider_event_id)
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null,
  plan_key text not null,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text not null,
  provider_product_id text,
  provider_price_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  quantity integer not null default 1 check (quantity > 0),
  tier_key text not null default 'standard',
  entitlement_rank integer not null default 0,
  child_limit integer check (child_limit is null or child_limit between 0 and 100),
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  provider_updated_at timestamptz,
  latest_provider_event_id text,
  latest_transaction_id text,
  environment text,
  auto_renew_status boolean,
  reconciled_at timestamptz,
  provider_schedule_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_entitlements_provider_subscription_unique
    unique (provider, provider_subscription_id)
);

alter table public.subscription_provider_events
  add column if not exists event_subtype text,
  add column if not exists current_transaction_id text,
  add column if not exists original_transaction_id text,
  add column if not exists environment text,
  add column if not exists occurred_at timestamptz,
  add column if not exists received_at timestamptz not null default timezone('utc', now()),
  add column if not exists processed_at timestamptz,
  add column if not exists outcome text,
  add column if not exists attempts integer not null default 1,
  add column if not exists payload_hash text,
  add column if not exists error_message text;

alter table public.user_entitlements
  add column if not exists provider_customer_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists quantity integer not null default 1,
  add column if not exists tier_key text not null default 'standard',
  add column if not exists entitlement_rank integer not null default 0,
  add column if not exists child_limit integer,
  add column if not exists limits jsonb not null default '{}'::jsonb,
  add column if not exists features jsonb not null default '{}'::jsonb,
  add column if not exists provider_updated_at timestamptz,
  add column if not exists latest_provider_event_id text,
  add column if not exists latest_transaction_id text,
  add column if not exists environment text,
  add column if not exists auto_renew_status boolean,
  add column if not exists reconciled_at timestamptz,
  add column if not exists provider_schedule_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.subscription_provider_events'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%provider, provider_event_id%'
  ) then
    alter table public.subscription_provider_events
      add constraint subscription_provider_events_provider_event_unique
      unique (provider, provider_event_id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_entitlements'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%provider, provider_subscription_id%'
  ) then
    alter table public.user_entitlements
      add constraint user_entitlements_provider_subscription_unique
      unique (provider, provider_subscription_id);
  end if;
end;
$$;

create index if not exists user_entitlements_user_app_idx
  on public.user_entitlements (user_id, app_key, entitlement_rank desc);
create index if not exists user_entitlements_period_end_idx
  on public.user_entitlements (current_period_end);

create table if not exists public.subscription_plan_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_id uuid not null references public.user_entitlements(id) on delete cascade,
  provider text not null,
  provider_subscription_id text not null,
  provider_schedule_id text,
  app_key text not null,
  from_plan_key text not null,
  target_plan_key text not null,
  from_child_limit integer not null,
  target_child_limit integer not null check (target_child_limit between 1 and 6),
  effective_at timestamptz not null,
  status text not null default 'requested'
    check (status in ('requested', 'scheduled', 'applied', 'canceled', 'superseded', 'failed')),
  client_request_id uuid not null,
  applied_provider_event_id text,
  failure_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_request_id)
);

create unique index if not exists subscription_plan_changes_one_pending_idx
  on public.subscription_plan_changes (entitlement_id)
  where status in ('requested', 'scheduled');
create unique index if not exists subscription_plan_changes_schedule_idx
  on public.subscription_plan_changes (provider, provider_schedule_id)
  where provider_schedule_id is not null;

create table if not exists public.subscription_plan_change_children (
  change_id uuid not null references public.subscription_plan_changes(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  primary key (change_id, child_id)
);

create table if not exists public.user_entitlement_children (
  entitlement_id uuid not null references public.user_entitlements(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  activated_at timestamptz not null default timezone('utc', now()),
  primary key (entitlement_id, child_id)
);

create table if not exists public.family_child_app_access (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  app_key text not null,
  status text not null default 'active'
    check (status in ('active', 'paused_by_plan', 'paused_by_parent', 'revoked')),
  status_reason text,
  source_entitlement_id uuid references public.user_entitlements(id) on delete set null,
  activated_at timestamptz,
  paused_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (family_id, child_id, app_key)
);

alter table public.subscription_provider_events enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.subscription_plan_changes enable row level security;
alter table public.subscription_plan_change_children enable row level security;
alter table public.user_entitlement_children enable row level security;
alter table public.family_child_app_access enable row level security;

drop policy if exists user_entitlements_select_own on public.user_entitlements;
create policy user_entitlements_select_own
on public.user_entitlements for select to authenticated
using (user_id = auth.uid());

drop policy if exists subscription_plan_changes_select_own on public.subscription_plan_changes;
create policy subscription_plan_changes_select_own
on public.subscription_plan_changes for select to authenticated
using (user_id = auth.uid());

drop policy if exists subscription_plan_change_children_select_own
  on public.subscription_plan_change_children;
create policy subscription_plan_change_children_select_own
on public.subscription_plan_change_children for select to authenticated
using (
  exists (
    select 1
    from public.subscription_plan_changes change
    where change.id = change_id
      and change.user_id = auth.uid()
  )
);

drop policy if exists user_entitlement_children_select_own
  on public.user_entitlement_children;
create policy user_entitlement_children_select_own
on public.user_entitlement_children for select to authenticated
using (
  exists (
    select 1
    from public.user_entitlements entitlement
    where entitlement.id = entitlement_id
      and entitlement.user_id = auth.uid()
  )
);

drop policy if exists family_child_app_access_family_select
  on public.family_child_app_access;
create policy family_child_app_access_family_select
on public.family_child_app_access for select to authenticated
using (
  exists (
    select 1
    from public.families family
    where family.id = family_id
      and (
        family.owner_id = auth.uid()
        or exists (
          select 1 from public.family_members member
          where member.family_id = family.id and member.user_id = auth.uid()
        )
      )
  )
);

revoke all on public.subscription_provider_events from anon, authenticated;
revoke insert, update, delete on public.user_entitlements from anon, authenticated;
revoke insert, update, delete on public.subscription_plan_changes from anon, authenticated;
revoke insert, update, delete on public.subscription_plan_change_children from anon, authenticated;
revoke insert, update, delete on public.user_entitlement_children from anon, authenticated;
revoke insert, update, delete on public.family_child_app_access from anon, authenticated;
grant select on public.user_entitlements to authenticated;
grant select on public.subscription_plan_changes to authenticated;
grant select on public.subscription_plan_change_children to authenticated;
grant select on public.user_entitlement_children to authenticated;
grant select on public.family_child_app_access to authenticated;

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
    order by entitlement.entitlement_rank desc
    limit 1
  ) access on true
  where member.family_id = v_family_id
    and member.role::text = 'child'
  on conflict (family_id, child_id, app_key) do update set
    status = excluded.status,
    status_reason = excluded.status_reason,
    source_entitlement_id = excluded.source_entitlement_id,
    activated_at = case
      when excluded.status = 'active'
        then coalesce(public.family_child_app_access.activated_at, excluded.activated_at)
      else public.family_child_app_access.activated_at
    end,
    paused_at = excluded.paused_at,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.set_entitlement_child_assignments(
  p_entitlement_id uuid,
  p_child_ids uuid[],
  p_reason text default 'plan_change'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement public.user_entitlements%rowtype;
  v_family_id uuid;
  v_distinct_count integer;
  v_owned_count integer;
begin
  select * into v_entitlement
  from public.user_entitlements
  where id = p_entitlement_id
  for update;

  if v_entitlement.id is null then
    raise exception 'entitlement_not_found';
  end if;

  select family.id into v_family_id
  from public.families family
  where family.owner_id = v_entitlement.user_id
  order by family.created_at
  limit 1;

  select count(distinct child_id) into v_distinct_count
  from unnest(coalesce(p_child_ids, '{}'::uuid[])) as selected(child_id);

  if v_distinct_count > coalesce(v_entitlement.child_limit, 0) then
    raise exception 'child_limit_exceeded';
  end if;

  select count(*) into v_owned_count
  from public.family_members member
  where member.family_id = v_family_id
    and member.role::text = 'child'
    and member.user_id = any(coalesce(p_child_ids, '{}'::uuid[]));

  if v_owned_count <> v_distinct_count then
    raise exception 'child_ownership_mismatch';
  end if;

  delete from public.user_entitlement_children
  where entitlement_id = p_entitlement_id;

  insert into public.user_entitlement_children (entitlement_id, child_id)
  select p_entitlement_id, child_id
  from unnest(coalesce(p_child_ids, '{}'::uuid[])) as selected(child_id)
  on conflict do nothing;

  perform public.recompute_family_child_app_access(v_entitlement.user_id, 'earnly');
  return jsonb_build_object(
    'entitlementId', p_entitlement_id,
    'activeChildCount', v_distinct_count,
    'reason', p_reason
  );
end;
$$;

create or replace function public.get_plan_management_context()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with owned_family as (
    select family.id
    from public.families family
    where family.owner_id = auth.uid()
    order by family.created_at
    limit 1
  )
  select jsonb_build_object(
    'entitlements', coalesce((
      select jsonb_agg(to_jsonb(entitlement.*) order by entitlement.created_at desc)
      from public.user_entitlements entitlement
      where entitlement.user_id = auth.uid()
    ), '[]'::jsonb),
    'children', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', member.user_id,
          'name', coalesce(profile.full_name, profile.email, 'Child'),
          'joinedAt', member.joined_at,
          'earnlyStatus', coalesce(access.status, 'active')
        )
        order by member.joined_at
      )
      from public.family_members member
      join owned_family family on family.id = member.family_id
      join public.profiles profile on profile.id = member.user_id
      left join public.family_child_app_access access
        on access.family_id = member.family_id
       and access.child_id = member.user_id
       and access.app_key = 'earnly'
      where member.role::text = 'child'
    ), '[]'::jsonb),
    'pendingChanges', coalesce((
      select jsonb_agg(
        to_jsonb(change.*) || jsonb_build_object(
          'activeChildIds',
          coalesce((
            select jsonb_agg(selected.child_id)
            from public.subscription_plan_change_children selected
            where selected.change_id = change.id
          ), '[]'::jsonb)
        )
        order by change.created_at desc
      )
      from public.subscription_plan_changes change
      where change.user_id = auth.uid()
        and change.status in ('requested', 'scheduled')
    ), '[]'::jsonb)
  );
$$;

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
    ORDER BY ue.entitlement_rank DESC, ue.current_period_end DESC NULLS FIRST
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

create or replace function public.get_effective_app_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_agg(public.has_app_access(requested_app_key))
  from unnest(array['earnly', 'scholars', 'ballr', 'tinypal']) requested_app_key;
$$;

create or replace function public.get_ecosystem_account()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then null else jsonb_build_object(
    'user_id', auth.uid(),
    'profile', (
      select to_jsonb(profile.*)
      from public.profiles profile
      where profile.id = auth.uid()
    ),
    'families', coalesce((
      select jsonb_agg(to_jsonb(family.*) order by family.created_at)
      from public.families family
      where family.owner_id = auth.uid()
         or exists (
           select 1 from public.family_members member
           where member.family_id = family.id and member.user_id = auth.uid()
         )
    ), '[]'::jsonb),
    'family_members', coalesce((
      select jsonb_agg(to_jsonb(member.*) order by member.joined_at)
      from public.family_members member
      where member.user_id = auth.uid()
         or exists (
           select 1 from public.families family
           where family.id = member.family_id and family.owner_id = auth.uid()
         )
    ), '[]'::jsonb),
    'subscriptions', coalesce((
      select jsonb_agg(to_jsonb(subscription.*) order by subscription.app_name)
      from public.subscriptions subscription
      where subscription.user_id = auth.uid()
    ), '[]'::jsonb),
    'app_access', coalesce((
      select jsonb_agg(to_jsonb(access.*) order by access.app_name)
      from public.app_access access
      where access.user_id = auth.uid()
    ), '[]'::jsonb),
    'entitlements', coalesce((
      select jsonb_agg(to_jsonb(entitlement.*) order by entitlement.created_at desc)
      from public.user_entitlements entitlement
      where entitlement.user_id = auth.uid()
    ), '[]'::jsonb),
    'effective_access', coalesce((
      select jsonb_agg(public.has_app_access(requested_app_key))
      from unnest(array['earnly', 'scholars', 'ballr', 'tinypal']) requested_app_key
    ), '[]'::jsonb)
  ) end;
$$;

create or replace function public.apply_subscription_provider_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_event_subtype text,
  p_occurred_at timestamptz,
  p_user_id uuid,
  p_provider_customer_id text,
  p_provider_subscription_id text,
  p_provider_product_id text,
  p_provider_price_id text,
  p_app_key text,
  p_plan_key text,
  p_tier_key text,
  p_entitlement_rank integer,
  p_child_limit integer,
  p_limits jsonb,
  p_features jsonb,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_quantity integer,
  p_current_transaction_id text,
  p_environment text,
  p_auto_renew_status boolean,
  p_payload_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.user_entitlements%rowtype;
  v_entitlement_id uuid;
  v_change public.subscription_plan_changes%rowtype;
  v_child_ids uuid[];
begin
  insert into public.subscription_provider_events (
    provider, provider_event_id, event_type, event_subtype, occurred_at,
    user_id, provider_subscription_id, current_transaction_id, environment,
    payload_hash, outcome
  ) values (
    p_provider, p_event_id, p_event_type, p_event_subtype, p_occurred_at,
    p_user_id, p_provider_subscription_id, p_current_transaction_id, p_environment,
    p_payload_hash, 'processing'
  )
  on conflict (provider, provider_event_id) do nothing;

  if not found then
    return jsonb_build_object('outcome', 'duplicate', 'eventId', p_event_id);
  end if;

  select * into v_existing
  from public.user_entitlements
  where provider = p_provider
    and provider_subscription_id = p_provider_subscription_id
  for update;

  if v_existing.id is not null and v_existing.user_id <> p_user_id then
    update public.subscription_provider_events
    set processed_at = timezone('utc', now()), outcome = 'rejected',
        error_message = 'subscription_owner_mismatch'
    where provider = p_provider and provider_event_id = p_event_id;
    return jsonb_build_object('outcome', 'rejected', 'eventId', p_event_id);
  end if;

  if v_existing.provider_updated_at is not null
     and p_occurred_at < v_existing.provider_updated_at then
    update public.subscription_provider_events
    set processed_at = timezone('utc', now()), outcome = 'stale'
    where provider = p_provider and provider_event_id = p_event_id;
    return jsonb_build_object('outcome', 'stale', 'eventId', p_event_id);
  end if;

  insert into public.user_entitlements (
    user_id, app_key, plan_key, provider, provider_customer_id,
    provider_subscription_id, provider_product_id, provider_price_id,
    status, current_period_start, current_period_end, cancel_at_period_end,
    quantity, tier_key, entitlement_rank, child_limit, limits, features,
    provider_updated_at, latest_provider_event_id, latest_transaction_id,
    environment, auto_renew_status, reconciled_at, updated_at
  ) values (
    p_user_id, p_app_key, p_plan_key, p_provider, p_provider_customer_id,
    p_provider_subscription_id, p_provider_product_id, p_provider_price_id,
    p_status, p_current_period_start, p_current_period_end, p_cancel_at_period_end,
    greatest(1, coalesce(p_quantity, 1)), p_tier_key, p_entitlement_rank,
    p_child_limit, coalesce(p_limits, '{}'::jsonb), coalesce(p_features, '{}'::jsonb),
    p_occurred_at, p_event_id, p_current_transaction_id, p_environment,
    p_auto_renew_status, timezone('utc', now()), timezone('utc', now())
  )
  on conflict (provider, provider_subscription_id) do update set
    app_key = excluded.app_key,
    plan_key = excluded.plan_key,
    provider_customer_id = excluded.provider_customer_id,
    provider_product_id = excluded.provider_product_id,
    provider_price_id = excluded.provider_price_id,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    quantity = excluded.quantity,
    tier_key = excluded.tier_key,
    entitlement_rank = excluded.entitlement_rank,
    child_limit = excluded.child_limit,
    limits = excluded.limits,
    features = excluded.features,
    provider_updated_at = excluded.provider_updated_at,
    latest_provider_event_id = excluded.latest_provider_event_id,
    latest_transaction_id = excluded.latest_transaction_id,
    environment = excluded.environment,
    auto_renew_status = excluded.auto_renew_status,
    reconciled_at = excluded.reconciled_at,
    updated_at = excluded.updated_at
  returning id into v_entitlement_id;

  select * into v_change
  from public.subscription_plan_changes change
  where change.entitlement_id = v_entitlement_id
    and change.status = 'scheduled'
    and change.target_plan_key = p_plan_key
    and p_current_period_start >= change.effective_at
  order by change.created_at desc
  limit 1
  for update;

  if v_change.id is not null then
    select coalesce(array_agg(child.child_id), '{}'::uuid[]) into v_child_ids
    from public.subscription_plan_change_children child
    where child.change_id = v_change.id;

    perform public.set_entitlement_child_assignments(
      v_entitlement_id,
      v_child_ids,
      'scheduled_downgrade'
    );

    update public.subscription_plan_changes
    set status = 'applied',
        applied_provider_event_id = p_event_id,
        updated_at = timezone('utc', now())
    where id = v_change.id;

    update public.user_entitlements
    set provider_schedule_id = null
    where id = v_entitlement_id;
  else
    perform public.recompute_family_child_app_access(p_user_id, 'earnly');
  end if;

  update public.subscription_provider_events
  set processed_at = timezone('utc', now()), outcome = 'applied'
  where provider = p_provider and provider_event_id = p_event_id;

  return jsonb_build_object(
    'outcome', 'applied',
    'eventId', p_event_id,
    'entitlementId', v_entitlement_id
  );
exception when others then
  update public.subscription_provider_events
  set processed_at = timezone('utc', now()), outcome = 'failed',
      error_message = sqlstate
  where provider = p_provider and provider_event_id = p_event_id;
  raise;
end;
$$;

revoke all on function public.recompute_family_child_app_access(uuid, text)
  from public, anon, authenticated;
revoke all on function public.set_entitlement_child_assignments(uuid, uuid[], text)
  from public, anon, authenticated;
revoke all on function public.apply_subscription_provider_event(
  text,text,text,text,timestamptz,uuid,text,text,text,text,text,text,text,
  integer,integer,jsonb,jsonb,text,timestamptz,timestamptz,boolean,integer,
  text,text,boolean,text
) from public, anon, authenticated;
revoke all on function public.get_plan_management_context() from public, anon;
grant execute on function public.get_plan_management_context() to authenticated;
revoke all on function public.has_app_access(text) from public, anon;
grant execute on function public.has_app_access(text) to authenticated;
revoke all on function public.get_effective_app_access() from public, anon;
grant execute on function public.get_effective_app_access() to authenticated;
revoke all on function public.get_ecosystem_account() from public, anon;
grant execute on function public.get_ecosystem_account() to authenticated;

commit;
