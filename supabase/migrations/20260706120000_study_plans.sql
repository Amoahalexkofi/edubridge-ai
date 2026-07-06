-- AI Study Planner (July workplan: "Integrate AI Tutor and AI study planner").
-- One active plan per student; plan JSON holds weeks/items with done flags.
-- Written via the user's own authenticated client — plain owner RLS.

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  exam_date date not null,
  subject_ids jsonb not null default '[]'::jsonb,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_plans enable row level security;

drop policy if exists "Users manage own study plan" on public.study_plans;
create policy "Users manage own study plan"
  on public.study_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
