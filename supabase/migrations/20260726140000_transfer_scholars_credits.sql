-- Move remaining Scholars AI credits (and recurring credit subs) between kids.

create or replace function public.transfer_scholars_credits(
  p_parent_user_id uuid,
  p_from_child_id uuid,
  p_to_child_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  from_bal public.scholars_credit_balances%rowtype;
  gens integer := 0;
  mins integer := 0;
  to_gens integer := 0;
  to_mins integer := 0;
begin
  if p_from_child_id is null or p_to_child_id is null then
    raise exception 'from and to child are required';
  end if;
  if p_from_child_id = p_to_child_id then
    raise exception 'cannot transfer credits to the same child';
  end if;
  if p_parent_user_id is null then
    raise exception 'parent is required';
  end if;
  -- Allow transferring from/to the parent's own unassigned pool (child_user_id = parent).
  if p_from_child_id is distinct from p_parent_user_id
     and not public.parent_owns_child(p_parent_user_id, p_from_child_id) then
    raise exception 'parent does not own source child';
  end if;
  if p_to_child_id is distinct from p_parent_user_id
     and not public.parent_owns_child(p_parent_user_id, p_to_child_id) then
    raise exception 'parent does not own destination child';
  end if;

  select * into from_bal
  from public.scholars_credit_balances
  where child_user_id = p_from_child_id
  for update;

  gens := coalesce(from_bal.generations_remaining, 0);
  mins := coalesce(from_bal.tutor_minutes_remaining, 0);

  if gens > 0 or mins > 0 then
    update public.scholars_credit_balances
    set
      generations_remaining = 0,
      tutor_minutes_remaining = 0,
      updated_at = timezone('utc', now())
    where child_user_id = p_from_child_id;

    insert into public.scholars_credit_balances (
      child_user_id,
      parent_user_id,
      generations_remaining,
      tutor_minutes_remaining
    )
    values (p_to_child_id, p_parent_user_id, gens, mins)
    on conflict (child_user_id) do update
    set
      parent_user_id = coalesce(
        excluded.parent_user_id,
        scholars_credit_balances.parent_user_id
      ),
      generations_remaining =
        scholars_credit_balances.generations_remaining + excluded.generations_remaining,
      tutor_minutes_remaining =
        scholars_credit_balances.tutor_minutes_remaining + excluded.tutor_minutes_remaining,
      updated_at = timezone('utc', now());

    select generations_remaining, tutor_minutes_remaining
      into to_gens, to_mins
    from public.scholars_credit_balances
    where child_user_id = p_to_child_id;

    if gens > 0 then
      insert into public.scholars_credit_ledger (
        child_user_id, kind, delta, reason, balance_after, metadata
      ) values
        (
          p_from_child_id,
          'generations',
          -gens,
          'transfer_out',
          0,
          jsonb_build_object('to_child_id', p_to_child_id, 'parent_user_id', p_parent_user_id)
        ),
        (
          p_to_child_id,
          'generations',
          gens,
          'transfer_in',
          to_gens,
          jsonb_build_object('from_child_id', p_from_child_id, 'parent_user_id', p_parent_user_id)
        );
    end if;

    if mins > 0 then
      insert into public.scholars_credit_ledger (
        child_user_id, kind, delta, reason, balance_after, metadata
      ) values
        (
          p_from_child_id,
          'tutor_minutes',
          -mins,
          'transfer_out',
          0,
          jsonb_build_object('to_child_id', p_to_child_id, 'parent_user_id', p_parent_user_id)
        ),
        (
          p_to_child_id,
          'tutor_minutes',
          mins,
          'transfer_in',
          to_mins,
          jsonb_build_object('from_child_id', p_from_child_id, 'parent_user_id', p_parent_user_id)
        );
    end if;
  end if;

  -- Drop source subs that would collide with an existing target kind.
  delete from public.scholars_credit_subscriptions s_from
  using public.scholars_credit_subscriptions s_to
  where s_from.child_user_id = p_from_child_id
    and s_to.child_user_id = p_to_child_id
    and s_from.kind = s_to.kind;

  update public.scholars_credit_subscriptions
  set
    child_user_id = p_to_child_id,
    parent_user_id = coalesce(parent_user_id, p_parent_user_id),
    updated_at = timezone('utc', now())
  where child_user_id = p_from_child_id
    and status in ('active', 'trialing', 'past_due');

  return jsonb_build_object(
    'outcome', case when gens > 0 or mins > 0 then 'transferred' else 'noop' end,
    'generations', gens,
    'tutor_minutes', mins
  );
end;
$$;

revoke all on function public.transfer_scholars_credits(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.transfer_scholars_credits(uuid, uuid, uuid) to service_role;
