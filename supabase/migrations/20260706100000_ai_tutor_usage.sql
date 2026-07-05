-- Per-student daily AI Tutor usage counter (cost control).
-- Written ONLY by the server with the service-role key; RLS is enabled with
-- no policies, so students cannot read or tamper with their counters via the
-- client API. (No triggers reference auth.uid() here — see the service-role
-- gotcha that caused the exam-score bug.)

create table if not exists public.ai_tutor_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_tutor_usage enable row level security;
