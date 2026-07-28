-- Wire Fresher into provisioning, effective access, and backfill legacy rows.
-- Requires 20260723170000_add_fresher_enum.sql.

begin;

create or replace function public.get_effective_app_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_agg(public.has_app_access(requested_app_key))
  from unnest(array['earnly', 'scholars', 'ballr', 'tinypal', 'fresher']) requested_app_key;
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
      from unnest(array['earnly', 'scholars', 'ballr', 'tinypal', 'fresher']) requested_app_key
    ), '[]'::jsonb)
  ) end;
$$;

create or replace function public.provision_ecosystem_account(
  p_user_id uuid,
  p_email text,
  p_full_name text default null,
  p_avatar_url text default null,
  p_role text default null,
  p_family_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := lower(coalesce(nullif(trim(p_role), ''), 'parent'));
  v_account_type text;
  v_full_name text := nullif(trim(p_full_name), '');
  v_family_name text;
  v_family_id uuid;
  v_app public.ecosystem_app_name;
begin
  v_account_type := case
    when v_role in ('individual', 'child') then 'individual'
    else 'parent'
  end;

  insert into public.profiles (id, email, full_name, avatar_url, account_type)
  values (
    p_user_id,
    coalesce(nullif(trim(p_email), ''), 'unknown@users.local'),
    v_full_name,
    nullif(trim(p_avatar_url), ''),
    v_account_type
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    account_type = coalesce(excluded.account_type, public.profiles.account_type),
    updated_at = timezone('utc', now());

  foreach v_app in array array[
    'tinypal'::public.ecosystem_app_name,
    'earnly'::public.ecosystem_app_name,
    'scholars'::public.ecosystem_app_name,
    'ballr'::public.ecosystem_app_name,
    'fresher'::public.ecosystem_app_name
  ] loop
    insert into public.app_access (user_id, app_name, has_access, access_source)
    values (p_user_id, v_app, false, 'none')
    on conflict (user_id, app_name) do nothing;

    insert into public.subscriptions (user_id, app_name, subscription_status, provider)
    values (p_user_id, v_app, 'none', 'stripe')
    on conflict (user_id, app_name) do nothing;
  end loop;

  if v_account_type = 'parent'
     and not exists (
       select 1 from public.family_members fm where fm.user_id = p_user_id
     ) then
    v_family_name := coalesce(
      nullif(trim(p_family_name), ''),
      case
        when v_full_name is not null then v_full_name || '''s Family'
        else 'My Family'
      end
    );

    insert into public.families (owner_id, family_name)
    values (p_user_id, v_family_name)
    returning id into v_family_id;

    insert into public.family_members (family_id, user_id, role)
    values (v_family_id, p_user_id, 'parent'::public.account_role);
  end if;
end;
$$;

revoke all on function public.provision_ecosystem_account(uuid, text, text, text, text, text) from public;
grant execute on function public.provision_ecosystem_account(uuid, text, text, text, text, text) to service_role;

revoke all on function public.get_effective_app_access() from public, anon;
grant execute on function public.get_effective_app_access() to authenticated;

revoke all on function public.get_ecosystem_account() from public, anon;
grant execute on function public.get_ecosystem_account() to authenticated;

insert into public.app_access (user_id, app_name, has_access, access_source)
select profile.id, 'fresher'::public.ecosystem_app_name, false, 'none'
from public.profiles profile
on conflict (user_id, app_name) do nothing;

insert into public.subscriptions (user_id, app_name, subscription_status, provider)
select profile.id, 'fresher'::public.ecosystem_app_name, 'none', 'stripe'
from public.profiles profile
on conflict (user_id, app_name) do nothing;

commit;
