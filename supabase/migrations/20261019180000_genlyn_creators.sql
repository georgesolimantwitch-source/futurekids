-- Genlyn Creator Program

create type public.creator_status as enum (
  'pending',
  'onboarding',
  'active',
  'paused',
  'rejected'
);

create type public.creator_commission_status as enum (
  'pending',
  'transferred',
  'failed',
  'reversed'
);

create type public.creator_commission_source as enum (
  'subscription',
  'hub',
  'other'
);

create table if not exists public.genlyn_creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null unique,
  display_name text,
  status public.creator_status not null default 'pending',
  stripe_connect_account_id text unique,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  total_referred_users integer not null default 0,
  total_gross_cents bigint not null default 0,
  total_commission_cents bigint not null default 0,
  total_paid_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint genlyn_creators_code_format check (code ~ '^[A-Z0-9]{4,12}$')
);

create index if not exists genlyn_creators_code_idx on public.genlyn_creators (code);
create index if not exists genlyn_creators_status_idx on public.genlyn_creators (status);

-- Sticky attribution: first creator code wins for a buyer
create table if not exists public.creator_referrals (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null unique references auth.users (id) on delete cascade,
  creator_id uuid not null references public.genlyn_creators (id) on delete cascade,
  creator_code text not null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists creator_referrals_creator_id_idx
  on public.creator_referrals (creator_id);

create table if not exists public.creator_commissions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.genlyn_creators (id) on delete cascade,
  buyer_user_id uuid references auth.users (id) on delete set null,
  source public.creator_commission_source not null,
  gross_cents integer not null check (gross_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  currency text not null default 'usd',
  status public.creator_commission_status not null default 'pending',
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,
  stripe_transfer_id text,
  hub_order_id uuid references public.hub_orders (id) on delete set null,
  description text,
  error_message text,
  created_at timestamptz not null default now(),
  transferred_at timestamptz
);

create unique index if not exists creator_commissions_invoice_unique
  on public.creator_commissions (stripe_invoice_id)
  where stripe_invoice_id is not null;

create unique index if not exists creator_commissions_pi_unique
  on public.creator_commissions (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists creator_commissions_creator_id_idx
  on public.creator_commissions (creator_id);

create or replace function public.set_genlyn_creators_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists genlyn_creators_set_updated_at on public.genlyn_creators;
create trigger genlyn_creators_set_updated_at
  before update on public.genlyn_creators
  for each row
  execute function public.set_genlyn_creators_updated_at();

alter table public.genlyn_creators enable row level security;
alter table public.creator_referrals enable row level security;
alter table public.creator_commissions enable row level security;

drop policy if exists "Creators read own profile" on public.genlyn_creators;
create policy "Creators read own profile"
  on public.genlyn_creators for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Creators read own referrals" on public.creator_referrals;
create policy "Creators read own referrals"
  on public.creator_referrals for select to authenticated
  using (
    exists (
      select 1 from public.genlyn_creators c
      where c.id = creator_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Buyers read own referral" on public.creator_referrals;
create policy "Buyers read own referral"
  on public.creator_referrals for select to authenticated
  using (auth.uid() = buyer_user_id);

drop policy if exists "Creators read own commissions" on public.creator_commissions;
create policy "Creators read own commissions"
  on public.creator_commissions for select to authenticated
  using (
    exists (
      select 1 from public.genlyn_creators c
      where c.id = creator_id and c.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.genlyn_creators from authenticated, anon;
revoke insert, update, delete on public.creator_referrals from authenticated, anon;
revoke insert, update, delete on public.creator_commissions from authenticated, anon;
grant select on public.genlyn_creators to authenticated;
grant select on public.creator_referrals to authenticated;
grant select on public.creator_commissions to authenticated;
grant all on public.genlyn_creators to service_role;
grant all on public.creator_referrals to service_role;
grant all on public.creator_commissions to service_role;

-- Add creator_code to hub orders if missing
alter table public.hub_orders
  add column if not exists creator_code text;
