-- Scheduled mock exam sessions: a teacher/admin sets up an exam event (subject,
-- time window, duration, question count) that students join during the window.
-- Attempts made in a session reference it so performance can be tracked per cohort.

create table if not exists public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  exam_type public.exam_type not null,
  question_count int not null default 40,
  duration_minutes int not null default 40,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.exam_sessions to authenticated;
grant all on public.exam_sessions to service_role;
alter table public.exam_sessions enable row level security;

-- Any signed-in user can see sessions (students need to view + join them)
drop policy if exists "Anyone can view sessions" on public.exam_sessions;
create policy "Anyone can view sessions" on public.exam_sessions
  for select to authenticated using (true);

-- Only content authors (teacher/admin/super_admin) create/edit/delete sessions
drop policy if exists "Staff manage sessions" on public.exam_sessions;
create policy "Staff manage sessions" on public.exam_sessions
  for all to authenticated
  using (
    public.has_role(auth.uid(), 'teacher')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'super_admin')
  )
  with check (
    public.has_role(auth.uid(), 'teacher')
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'super_admin')
  );

-- Link attempts to a session (null = ordinary on-demand mock)
alter table public.exam_attempts
  add column if not exists session_id uuid references public.exam_sessions(id) on delete set null;
create index if not exists idx_exam_attempts_session on public.exam_attempts(session_id);
