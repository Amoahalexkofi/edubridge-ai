-- Self-contained error monitoring: server + client errors are logged here,
-- deduplicated by fingerprint (message + path + source) so a recurring bug
-- increments a count instead of flooding the table. Admins read it on a dashboard.

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  fingerprint text unique not null,
  message text not null,
  source text,                       -- 'server' | 'client'
  path text,
  stack text,
  digest text,
  user_id uuid,
  user_agent text,
  count int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

grant select on public.error_logs to authenticated;
grant all on public.error_logs to service_role;
alter table public.error_logs enable row level security;

-- Only admins / super admins can read the error log.
drop policy if exists "Staff read errors" on public.error_logs;
create policy "Staff read errors" on public.error_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin'));

-- Insert-or-increment by fingerprint. Called server-side only (service role).
create or replace function public.log_error(
  p_message text, p_source text, p_path text, p_stack text,
  p_digest text, p_user_id uuid, p_user_agent text
) returns void language plpgsql security definer set search_path = public as $$
declare fp text;
begin
  fp := md5(coalesce(p_message,'') || '|' || coalesce(p_path,'') || '|' || coalesce(p_source,''));
  insert into public.error_logs (fingerprint, message, source, path, stack, digest, user_id, user_agent)
  values (fp, left(p_message, 2000), p_source, left(p_path, 500), left(p_stack, 6000), p_digest, p_user_id, left(p_user_agent, 500))
  on conflict (fingerprint) do update
    set count = public.error_logs.count + 1,
        last_seen = now(),
        stack = coalesce(excluded.stack, public.error_logs.stack),
        user_id = coalesce(excluded.user_id, public.error_logs.user_id);
end; $$;

grant execute on function public.log_error(text, text, text, text, text, uuid, text) to service_role;
