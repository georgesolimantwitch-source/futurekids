-- Creator codes are short: 4–6 characters, unique (already enforced).

alter table public.genlyn_creators
  drop constraint if exists genlyn_creators_code_format;

-- Shorten any existing codes that exceeded 6 chars (keep uniqueness).
do $$
declare
  r record;
  candidate text;
  n int;
begin
  for r in
    select id, code
    from public.genlyn_creators
    where length(code) > 6
  loop
    candidate := left(r.code, 6);
    n := 0;
    while exists (
      select 1 from public.genlyn_creators c
      where c.code = candidate and c.id <> r.id
    ) loop
      n := n + 1;
      candidate := left(r.code, 3) || lpad((n % 1000)::text, 3, '0');
      candidate := upper(regexp_replace(candidate, '[^A-Z0-9]', '', 'g'));
      candidate := left(candidate, 6);
      if n > 200 then
        candidate := upper(substr(md5(r.id::text || clock_timestamp()::text), 1, 6));
        exit;
      end if;
    end loop;
    update public.genlyn_creators set code = candidate where id = r.id;
  end loop;
end $$;

alter table public.genlyn_creators
  add constraint genlyn_creators_code_format
  check (code ~ '^[A-Z0-9]{4,6}$');
