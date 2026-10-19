-- Genlyn Hub hardware orders (one-time Stripe PaymentIntents)

create type public.hub_order_size as enum ('10.1', '15.6');

create type public.hub_order_status as enum (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'canceled',
  'refunded'
);

create table if not exists public.hub_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  size public.hub_order_size not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  status public.hub_order_status not null default 'pending',
  shipping_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'US',
  shipping_phone text,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  carrier text,
  tracking_number text,
  tracking_url text,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_orders_user_id_idx on public.hub_orders (user_id);
create index if not exists hub_orders_status_idx on public.hub_orders (status);
create index if not exists hub_orders_created_at_idx on public.hub_orders (created_at desc);

create or replace function public.set_hub_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hub_orders_set_updated_at on public.hub_orders;
create trigger hub_orders_set_updated_at
  before update on public.hub_orders
  for each row
  execute function public.set_hub_orders_updated_at();

alter table public.hub_orders enable row level security;

drop policy if exists "Users read own hub orders" on public.hub_orders;
create policy "Users read own hub orders"
  on public.hub_orders
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates only via service role (webhooks + admin API).
revoke insert, update, delete on public.hub_orders from authenticated, anon;
grant select on public.hub_orders to authenticated;
grant all on public.hub_orders to service_role;
