-- Scholars AI credit balances (generations + tutor minutes)

create table if not exists public.scholars_credit_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  generations_remaining integer not null default 0
    check (generations_remaining >= 0),
  tutor_minutes_remaining integer not null default 0
    check (tutor_minutes_remaining >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scholars_credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('generations', 'tutor_minutes')),
  quantity integer not null check (quantity > 0),
  period_key text not null,
  lookup_key text not null,
  stripe_event_id text,
  stripe_invoice_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists scholars_credit_grants_idempotent_lookup
  on public.scholars_credit_grants (user_id, lookup_key, period_key);

create unique index if not exists scholars_credit_grants_idempotent_invoice
  on public.scholars_credit_grants (stripe_invoice_id, kind)
  where stripe_invoice_id is not null;

create unique index if not exists scholars_credit_grants_idempotent_session
  on public.scholars_credit_grants (stripe_checkout_session_id, kind)
  where stripe_checkout_session_id is not null;

create table if not exists public.scholars_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('generations', 'tutor_minutes')),
  delta integer not null,
  reason text not null,
  balance_after integer not null,
  grant_id uuid references public.scholars_credit_grants (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists scholars_credit_ledger_user_created
  on public.scholars_credit_ledger (user_id, created_at desc);

create table if not exists public.scholars_credit_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('generations', 'tutor_minutes')),
  quantity integer not null check (quantity > 0),
  period text not null check (period in ('monthly', 'yearly')),
  lookup_key text not null,
  stripe_subscription_id text not null,
  stripe_subscription_item_id text,
  stripe_price_id text,
  status text not null default 'active',
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, kind)
);

alter table public.scholars_credit_balances enable row level security;
alter table public.scholars_credit_grants enable row level security;
alter table public.scholars_credit_ledger enable row level security;
alter table public.scholars_credit_subscriptions enable row level security;

create policy scholars_credit_balances_select_own
  on public.scholars_credit_balances for select
  using (auth.uid() = user_id);

create policy scholars_credit_ledger_select_own
  on public.scholars_credit_ledger for select
  using (auth.uid() = user_id);

create policy scholars_credit_subscriptions_select_own
  on public.scholars_credit_subscriptions for select
  using (auth.uid() = user_id);

-- Grants are service-role only (no user policies)

create or replace function public.get_scholars_credit_balance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal public.scholars_credit_balances%rowtype;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select * into bal from public.scholars_credit_balances where user_id = uid;
  if not found then
    return jsonb_build_object(
      'generations', 0,
      'tutor_minutes', 0
    );
  end if;

  return jsonb_build_object(
    'generations', bal.generations_remaining,
    'tutor_minutes', bal.tutor_minutes_remaining
  );
end;
$$;

create or replace function public.grant_scholars_credits(
  p_user_id uuid,
  p_kind text,
  p_quantity integer,
  p_period_key text,
  p_lookup_key text,
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

  insert into public.scholars_credit_grants (
    user_id, kind, quantity, period_key, lookup_key,
    stripe_event_id, stripe_invoice_id, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_subscription_id
  ) values (
    p_user_id, p_kind, p_quantity, p_period_key, p_lookup_key,
    p_stripe_event_id, p_stripe_invoice_id, p_stripe_checkout_session_id,
    p_stripe_payment_intent_id, p_stripe_subscription_id
  )
  on conflict (user_id, lookup_key, period_key) do nothing
  returning * into grant_row;

  if grant_row.id is null then
    return jsonb_build_object('outcome', 'duplicate');
  end if;

  insert into public.scholars_credit_balances (user_id, generations_remaining, tutor_minutes_remaining)
  values (p_user_id, 0, 0)
  on conflict (user_id) do nothing;

  if p_kind = 'generations' then
    update public.scholars_credit_balances
    set generations_remaining = generations_remaining + p_quantity,
        updated_at = timezone('utc', now())
    where user_id = p_user_id
    returning generations_remaining, tutor_minutes_remaining
      into new_gens, new_mins;

    insert into public.scholars_credit_ledger (
      user_id, kind, delta, reason, balance_after, grant_id
    ) values (
      p_user_id, 'generations', p_quantity, 'grant', new_gens, grant_row.id
    );
  else
    update public.scholars_credit_balances
    set tutor_minutes_remaining = tutor_minutes_remaining + p_quantity,
        updated_at = timezone('utc', now())
    where user_id = p_user_id
    returning generations_remaining, tutor_minutes_remaining
      into new_gens, new_mins;

    insert into public.scholars_credit_ledger (
      user_id, kind, delta, reason, balance_after, grant_id
    ) values (
      p_user_id, 'tutor_minutes', p_quantity, 'grant', new_mins, grant_row.id
    );
  end if;

  return jsonb_build_object(
    'outcome', 'applied',
    'grant_id', grant_row.id,
    'generations', new_gens,
    'tutor_minutes', new_mins
  );
end;
$$;

create or replace function public.consume_scholars_credits(
  p_kind text,
  p_quantity integer,
  p_reason text default 'spend'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
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

  select * into bal from public.scholars_credit_balances where user_id = uid for update;
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
    where user_id = uid
    returning generations_remaining into new_bal;
  else
    update public.scholars_credit_balances
    set tutor_minutes_remaining = tutor_minutes_remaining - p_quantity,
        updated_at = timezone('utc', now())
    where user_id = uid
    returning tutor_minutes_remaining into new_bal;
  end if;

  insert into public.scholars_credit_ledger (
    user_id, kind, delta, reason, balance_after
  ) values (
    uid, p_kind, -p_quantity, coalesce(p_reason, 'spend'), new_bal
  );

  select * into bal from public.scholars_credit_balances where user_id = uid;

  return jsonb_build_object(
    'ok', true,
    'generations', bal.generations_remaining,
    'tutor_minutes', bal.tutor_minutes_remaining
  );
end;
$$;

create or replace function public.upsert_scholars_credit_subscription(
  p_user_id uuid,
  p_kind text,
  p_quantity integer,
  p_period text,
  p_lookup_key text,
  p_stripe_subscription_id text,
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
    user_id, kind, quantity, period, lookup_key,
    stripe_subscription_id, stripe_subscription_item_id, stripe_price_id, status
  ) values (
    p_user_id, p_kind, p_quantity, p_period, p_lookup_key,
    p_stripe_subscription_id, p_stripe_subscription_item_id, p_stripe_price_id, p_status
  )
  on conflict (user_id, kind) do update set
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

grant execute on function public.get_scholars_credit_balance() to authenticated;
grant execute on function public.consume_scholars_credits(text, integer, text) to authenticated;
-- grant_scholars_credits / upsert: service role only (no grant to authenticated)
