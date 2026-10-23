-- Screen protector trial: 5 generations + 5 tutor minutes (was 15 minutes).

create or replace function public.issue_screen_protector_codes(
  p_count integer,
  p_order_label text,
  p_admin_token text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  label text := left(trim(coalesce(p_order_label, '')), 120);
  n integer := coalesce(p_count, 1);
  i integer;
  attempt integer;
  raw text;
  new_code text;
  inserted boolean;
  created jsonb := '[]'::jsonb;
begin
  if not public.screen_protector_admin_ok(p_admin_token) then
    raise exception 'forbidden';
  end if;
  if label = '' then
    raise exception 'order label required';
  end if;
  if n < 1 or n > 100 then
    raise exception 'count must be between 1 and 100';
  end if;

  for i in 1..n loop
    inserted := false;
    for attempt in 1..8 loop
      raw := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      new_code := 'SP-' || substr(raw, 1, 4) || '-' || substr(raw, 5, 4);
      begin
        insert into public.screen_protector_codes (code, order_label, generations, tutor_minutes)
        values (new_code, label, 5, 5);
        inserted := true;
        exit;
      exception when unique_violation then
        null;
      end;
    end loop;
    if not inserted then
      raise exception 'could not generate a unique code';
    end if;
    created := created || jsonb_build_array(jsonb_build_object(
      'code', new_code,
      'order_label', label,
      'generations', 5,
      'tutor_minutes', 5
    ));
  end loop;

  return jsonb_build_object('codes', created);
end;
$function$;

update public.screen_protector_codes
set tutor_minutes = 5
where claimed_at is null
  and tutor_minutes = 15;
