-- One Scholars credit wallet per Genlyn account: Stripe, App Store, plan allotments and perks
-- all grant here; the apps only read and spend it.

alter table public.scholars_credit_grants
  add column if not exists external_ref text;

-- One grant per provider purchase across all accounts (an Apple transaction can't be replayed into another account).
create unique index if not exists scholars_credit_grants_external_ref
  on public.scholars_credit_grants (external_ref, kind)
  where external_ref is not null;

drop function if exists public.grant_scholars_credits(
  uuid, text, integer, text, text, uuid, text, text, text, text, text
);

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
  p_stripe_subscription_id text default null,
  p_external_ref text default null,
  p_reason text default 'grant'
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
    stripe_payment_intent_id, stripe_subscription_id, external_ref
  ) values (
    p_child_user_id, p_parent_user_id, p_kind, p_quantity, p_period_key, p_lookup_key,
    p_stripe_event_id, p_stripe_invoice_id, p_stripe_checkout_session_id,
    p_stripe_payment_intent_id, p_stripe_subscription_id, p_external_ref
  )
  on conflict do nothing
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
    returning generations_remaining, tutor_minutes_remaining into new_gens, new_mins;
  else
    update public.scholars_credit_balances
    set tutor_minutes_remaining = tutor_minutes_remaining + p_quantity,
        updated_at = timezone('utc', now())
    where child_user_id = p_child_user_id
    returning generations_remaining, tutor_minutes_remaining into new_gens, new_mins;
  end if;

  insert into public.scholars_credit_ledger (
    child_user_id, kind, delta, reason, balance_after, grant_id, metadata
  ) values (
    p_child_user_id,
    p_kind,
    p_quantity,
    coalesce(p_reason, 'grant'),
    case when p_kind = 'generations' then new_gens else new_mins end,
    grant_row.id,
    jsonb_build_object('lookup_key', p_lookup_key, 'external_ref', p_external_ref)
  );

  return jsonb_build_object(
    'outcome', 'applied',
    'grant_id', grant_row.id,
    'child_user_id', p_child_user_id,
    'generations', new_gens,
    'tutor_minutes', new_mins
  );
end;
$$;

-- Granting and plan bookkeeping are server-only (service role).
revoke execute on function public.grant_scholars_credits(
  uuid, text, integer, text, text, uuid, text, text, text, text, text, text, text
) from public, anon, authenticated;
revoke execute on function public.upsert_scholars_credit_subscription(
  uuid, text, integer, text, text, text, uuid, text, text, text
) from public, anon, authenticated;
revoke execute on function public.get_scholars_credit_balance(uuid) from public, anon, authenticated;
revoke execute on function public.consume_scholars_credits(text, integer, text, uuid) from public, anon;
grant execute on function public.consume_scholars_credits(text, integer, text, uuid) to authenticated;
