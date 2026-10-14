-- Admin read/set of the Scholars credit wallet the iOS app syncs.
-- Callers must pass the secret stored in private.scholars_wallet_admin (id = 1).
-- That secret lives only in the database and in the Scholars admin server env.

create schema if not exists private;

create table if not exists private.scholars_wallet_admin (
  id integer primary key,
  secret text not null
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.scholars_wallet_admin from public, anon, authenticated;

drop function if exists public.admin_set_scholars_wallet(text, uuid, integer, integer);

create or replace function public.admin_set_scholars_wallet(
  p_secret text,
  p_email text,
  p_user_id uuid,
  p_generations integer,
  p_tutor_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  expected text;
  uid uuid;
  bal public.scholars_credit_balances%rowtype;
  new_gens integer;
  new_mins integer;
  email_norm text := nullif(lower(btrim(coalesce(p_email, ''))), '');
begin
  select secret into expected from private.scholars_wallet_admin where id = 1;
  if expected is null or p_secret is null or length(p_secret) <> length(expected) or p_secret <> expected then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if p_user_id is not null then
    select id into uid from auth.users where id = p_user_id;
  end if;
  if uid is null and email_norm is not null then
    select id into uid
    from auth.users
    where lower(email) = email_norm
    order by created_at asc
    limit 1;
  end if;
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'no_genlyn_account');
  end if;

  select * into bal
  from public.scholars_credit_balances
  where child_user_id = uid
  for update;

  if not found then
    if p_generations is null and p_tutor_minutes is null then
      return jsonb_build_object('ok', true, 'user_id', uid, 'generations', 0, 'tutor_minutes', 0);
    end if;
    insert into public.scholars_credit_balances (child_user_id, generations_remaining, tutor_minutes_remaining)
    values (uid, 0, 0);
    select * into bal from public.scholars_credit_balances where child_user_id = uid for update;
  end if;

  new_gens := bal.generations_remaining;
  new_mins := bal.tutor_minutes_remaining;

  if p_generations is not null then
    if p_generations < 0 or p_generations > 1000000 then
      return jsonb_build_object('ok', false, 'error', 'invalid_generations');
    end if;
    new_gens := p_generations;
  end if;
  if p_tutor_minutes is not null then
    if p_tutor_minutes < 0 or p_tutor_minutes > 1000000 then
      return jsonb_build_object('ok', false, 'error', 'invalid_tutor_minutes');
    end if;
    new_mins := p_tutor_minutes;
  end if;

  if new_gens is distinct from bal.generations_remaining
     or new_mins is distinct from bal.tutor_minutes_remaining then
    update public.scholars_credit_balances
    set generations_remaining = new_gens,
        tutor_minutes_remaining = new_mins,
        updated_at = timezone('utc', now())
    where child_user_id = uid;
  end if;

  if new_gens is distinct from bal.generations_remaining then
    insert into public.scholars_credit_ledger (child_user_id, kind, delta, reason, balance_after, metadata)
    values (uid, 'generations', new_gens - bal.generations_remaining, 'admin_adjust', new_gens, jsonb_build_object('source', 'scholars_admin'));
  end if;
  if new_mins is distinct from bal.tutor_minutes_remaining then
    insert into public.scholars_credit_ledger (child_user_id, kind, delta, reason, balance_after, metadata)
    values (uid, 'tutor_minutes', new_mins - bal.tutor_minutes_remaining, 'admin_adjust', new_mins, jsonb_build_object('source', 'scholars_admin'));
  end if;

  return jsonb_build_object('ok', true, 'user_id', uid, 'generations', new_gens, 'tutor_minutes', new_mins);
end;
$$;

revoke all on function public.admin_set_scholars_wallet(text, text, uuid, integer, integer) from public;
grant execute on function public.admin_set_scholars_wallet(text, text, uuid, integer, integer) to anon, authenticated, service_role;
