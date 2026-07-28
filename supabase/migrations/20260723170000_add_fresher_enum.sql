-- Add Fresher to ecosystem_app_name enum (must commit before the value is used).

begin;

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'ecosystem_app_name'
      and e.enumlabel = 'fresher'
  ) then
    alter type public.ecosystem_app_name add value 'fresher';
  end if;
end;
$$;

commit;
