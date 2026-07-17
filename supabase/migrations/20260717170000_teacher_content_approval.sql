-- Teacher content-authoring approval.
-- Teachers can sign up freely, but cannot create/edit content (lessons, questions,
-- topics) until an admin approves their individual account. Admins & super_admins
-- can always author. Existing teachers are grandfathered so no one loses access.

alter table public.profiles
  add column if not exists content_approved boolean not null default false;

-- Grandfather everyone who can currently author.
update public.profiles set content_approved = true
where id in (select user_id from public.user_roles where role in ('teacher','admin','super_admin'));

-- Central authoring check used by RLS: staff always; teachers only if approved.
create or replace function public.can_author(_uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(_uid,'admin')
      or public.has_role(_uid,'super_admin')
      or (public.has_role(_uid,'teacher')
          and exists (select 1 from public.profiles where id = _uid and content_approved));
$$;
grant execute on function public.can_author(uuid) to authenticated;

-- Re-point the content-management policies at can_author().
drop policy if exists "Teachers and admins manage topics" on public.topics;
create policy "Teachers and admins manage topics" on public.topics for all to authenticated
  using (public.can_author(auth.uid())) with check (public.can_author(auth.uid()));

drop policy if exists "Teachers/admins manage lessons" on public.lessons;
create policy "Teachers/admins manage lessons" on public.lessons for all to authenticated
  using (public.can_author(auth.uid())) with check (public.can_author(auth.uid()));

drop policy if exists "Teachers/admins manage questions" on public.questions;
create policy "Teachers/admins manage questions" on public.questions for all to authenticated
  using (public.can_author(auth.uid())) with check (public.can_author(auth.uid()));
