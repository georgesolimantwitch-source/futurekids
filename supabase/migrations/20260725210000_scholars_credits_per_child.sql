-- Per-child Scholars AI credit balances (credits belong to the child who uses them)

-- Balances: re-key to child_user_id
alter table public.scholars_credit_balances
  rename column user_id to child_user_id;

alter table public.scholars_credit_balances
  add column if not exists parent_user_id uuid references auth.users (id) on delete set null;

-- Grants
alter table public.scholars_credit_grants
  rename column user_id to child_user_id;

alter table public.scholars_credit_grants
  add column if not exists parent_user_id uuid references auth.users (id) on delete set null;

drop index if exists scholars_credit_grants_idempotent_lookup;
create unique index scholars_credit_grants_idempotent_lookup
  on public.scholars_credit_grants (child_user_id, lookup_key, period_key);

-- Ledger
alter table public.scholars_credit_ledger
  rename column user_id to child_user_id;

drop index if exists scholars_credit_ledger_user_created;
create index scholars_credit_ledger_child_created
  on public.scholars_credit_ledger (child_user_id, created_at desc);

-- Subscriptions
alter table public.scholars_credit_subscriptions
  rename column user_id to child_user_id;

alter table public.scholars_credit_subscriptions
  add column if not exists parent_user_id uuid references auth.users (id) on delete set null;

drop policy if exists scholars_credit_balances_select_own on public.scholars_credit_balances;
drop policy if exists scholars_credit_ledger_select_own on public.scholars_credit_ledger;
drop policy if exists scholars_credit_subscriptions_select_own on public.scholars_credit_subscriptions;

-- Parent ownership helper (mirrors app parentOwnsChild checks)
create or replace function public.parent_owns_child(p_parent_id uuid, p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.family_members child_fm
      where child_fm.user_id = p_child_id
        and child_fm.role = 'child'
        and (
          exists (
            select 1 from public.families f
            where f.id = child_fm.family_id and f.owner_id = p_parent_id
          )
          or exists (
            select 1 from public.family_members parent_fm
            where parent_fm.family_id = child_fm.family_id
              and parent_fm.user_id = p_parent_id
              and parent_fm.role = 'parent'
          )
        )
    )
    or exists (
      select 1 from public.child_profiles cp
      where cp.id = p_child_id and cp.created_by_parent_id = p_parent_id
    );
$$;

create policy scholars_credit_balances_select_child_or_parent
  on public.scholars_credit_balances for select
  using (
    auth.uid() = child_user_id
    or auth.uid() = parent_user_id
    or public.parent_owns_child(auth.uid(), child_user_id)
  );

create policy scholars_credit_ledger_select_child_or_parent
  on public.scholars_credit_ledger for select
  using (
    auth.uid() = child_user_id
    or public.parent_owns_child(auth.uid(), child_user_id)
  );

create policy scholars_credit_subscriptions_select_child_or_parent
  on public.scholars_credit_subscriptions for select
  using (
    auth.uid() = child_user_id
    or auth.uid() = parent_user_id
    or public.parent_owns_child(auth.uid(), child_user_id)
  );

-- Drop old signatures (columns renamed; old bodies are invalid)
drop function if exists public.get_scholars_credit_balance();
drop function if exists public.get_scholars_credit_balance(uuid);
drop function if exists public.grant_scholars_credits(uuid, text, integer, text, text, text, text, text, text, text);
drop function if exists public.consume_scholars_credits(text, integer, text);
drop function if exists public.consume_scholars_credits(text, integer, text, uuid);
drop function if exists public.upsert_scholars_credit_subscription(uuid, text, integer, text, text, text, text, text, text);
drop function if exists public.upsert_scholars_credit_subscription(uuid, text, integer, text, text, text, uuid, text, text, text);

create or replace function public.get_scholars_credit_balance(p_child_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  bal public.scholars_credit_balances%rowtype;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  target := coalesce(p_child_user_id, uid);

  if target <> uid and not public.parent_owns_child(uid, target) then
    raise exception 'forbidden';
  end if;

  select * into bal from public.scholars_credit_balances where child_user_id = target;
  if not found then
    return jsonb_build_object(
      'child_user_id', target,
      'generations', 0,
      'tutor_minutes', 0
    );
  end if;

  return jsonb_build_object(
    'child_user_id', target,
    'generations', bal.generations_remaining,
    'tutor_minutes', bal.tutor_minutes_remaining
  );
end;
$$;

create or replace function public.grant_scholars_credits(
  p_child_user_id uuid,
  p_kind text,
  p_quantity integer,
  p_period_key text,
  p_lookup_key text,
  p_parent_user_id uuid default null,
  p_stripe_event_id text default null,
  p_stripe_invoice_id text default null,
  p_stripe_checkout_session_id text default null,
  p_stripe_payment_intent_id text default null,
  p_stripe_subscription_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  grant_row public.scholars_credit_grants%rowtype;
  new_gens integer;
  new_mins integer;
begin
  if p_kind not in ('generations', 'tutor_minutes') then
    raise exception 'invalid kind';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'invalid quantity';
  end if;
  if p_child_user_id is null then
    raise exception 'child required';
  end if;

  insert into public.scholars_credit_grants (
    child_user_id, parent_user_id, kind, quantity, period_key, lookup_key,
    stripe_event_id, stripe_invoice_id, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_subscription_id
  ) values (
    p_child_user_id, p_parent_user_id, p_kind, p_quantity, p_period_key, p_lookup_key,
    p_stripe_event_id, p_stripe_invoice_id, p_stripe_checkout_session_id,
    p_stripe_payment_intent_id, p_stripe_subscription_id
  )
  on conflict (child_user_id, lookup_key, period_key) do nothing
  returning * into grant_row;

  if grant_row.id is null then
    return jsonb_build_object('outcome', 'duplicate');
  end if;

  insert into public.scholars_credit_balances (
    child_user_id, parent_user_id, generations_remaining, tutor_minutes_remaining
  ) values (p_child_user_id, p_parent_user_id, 0, 0)
  on conflict (child_user_id) do update set
    parent_user_id = coalesce(excluded.parent_user_id, scholars_credit_balances.parent_user_id);

  if p_kind = 'generations' then
    update public.scholars_credit_balances
    set generations_remaining = generations_remaining + p_quantity,
        updated_at = timezone('utc', now())
    where child_user_id = p_child_user_id
    returning generations_remaining, tutor_minutes_remaining
      into new_gens, new_mins;

    insert into public.scholars_credit_ledger (
      child_user_id, kind, delta, reason, balance_after, grant_id
    ) values (
      p_child_user_id, 'generations', p_quantity, 'grant', new_gens, grant_row.id
    );
  else
    update public.scholars_credit_balances
    set tutor_minutes_remaining = tutor_minutes_remaining + p_quantity,
        updated_at = timezone('utc', now())
    where child_user_id = p_child_user_id
    returning generations_remaining, tutor_minutes_remaining
      into new_gens, new_mins;

    insert into public.scholars_credit_ledger (
      child_user_id, kind, delta, reason, balance_after, grant_id
    ) values (
      p_child_user_id, 'tutor_minutes', p_quantity, 'grant', new_mins, grant_row.id
    );
  end if;

  return jsonb_build_object(
    'outcome', 'applied',
    'grant_id', grant_row.id,
    'child_user_id', p_child_user_id,
    'generations', new_gens,
    'tutor_minutes', new_mins
  );
end;
$$;

create or replace function public.consume_scholars_credits(
  p_kind text,
  p_quantity integer,
  p_reason text default 'spend',
  p_child_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  bal public.scholars_credit_balances%rowtype;
  available integer;
  new_bal integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_kind not in ('generations', 'tutor_minutes') then
    raise exception 'invalid kind';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'invalid quantity';
  end if;

  target := coalesce(p_child_user_id, uid);

  if target <> uid and not public.parent_owns_child(uid, target) then
    raise exception 'forbidden';
  end if;

  select * into bal from public.scholars_credit_balances where child_user_id = target for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credits');
  end if;

  available := case
    when p_kind = 'generations' then bal.generations_remaining
    else bal.tutor_minutes_remaining
  end;

  if available < p_quantity then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits',
      'generations', bal.generations_remaining,
      'tutor_minutes', bal.tutor_minutes_remaining
    );
  end if;

  if p_kind = 'generations' then
    update public.scholars_credit_balances
    set generations_remaining = generations_remaining - p_quantity,
        updated_at = timezone('utc', now())
    where child_user_id = target
    returning generations_remaining into new_bal;
  else
    update public.scholars_credit_balances
    set tutor_minutes_remaining = tutor_minutes_remaining - p_quantity,
        updated_at = timezone('utc', now())
    where child_user_id = target
    returning tutor_minutes_remaining into new_bal;
  end if;

  insert into public.scholars_credit_ledger (
    child_user_id, kind, delta, reason, balance_after
  ) values (
    target, p_kind, -p_quantity, coalesce(p_reason, 'spend'), new_bal
  );

  select * into bal from public.scholars_credit_balances where child_user_id = target;

  return jsonb_build_object(
    'ok', true,
    'child_user_id', target,
    'generations', bal.generations_remaining,
    'tutor_minutes', bal.tutor_minutes_remaining
  );
end;
$$;

create or replace function public.upsert_scholars_credit_subscription(
  p_child_user_id uuid,
  p_kind text,
  p_quantity integer,
  p_period text,
  p_lookup_key text,
  p_stripe_subscription_id text,
  p_parent_user_id uuid default null,
  p_stripe_subscription_item_id text default null,
  p_stripe_price_id text default null,
  p_status text default 'active'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.scholars_credit_subscriptions (
    child_user_id, parent_user_id, kind, quantity, period, lookup_key,
    stripe_subscription_id, stripe_subscription_item_id, stripe_price_id, status
  ) values (
    p_child_user_id, p_parent_user_id, p_kind, p_quantity, p_period, p_lookup_key,
    p_stripe_subscription_id, p_stripe_subscription_item_id, p_stripe_price_id, p_status
  )
  on conflict (child_user_id, kind) do update set
    parent_user_id = coalesce(excluded.parent_user_id, scholars_credit_subscriptions.parent_user_id),
    quantity = excluded.quantity,
    period = excluded.period,
    lookup_key = excluded.lookup_key,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_subscription_item_id = excluded.stripe_subscription_item_id,
    stripe_price_id = excluded.stripe_price_id,
    status = excluded.status,
    updated_at = timezone('utc', now());
end;
$$;

grant execute on function public.get_scholars_credit_balance(uuid) to authenticated;
grant execute on function public.consume_scholars_credits(text, integer, text, uuid) to authenticated;
grant execute on function public.parent_owns_child(uuid, uuid) to authenticated;
