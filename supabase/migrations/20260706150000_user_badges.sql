-- Persistent badges (July workplan: "Integrate gamification features —
-- badges, XP system, leaderboards"). XP/levels/streaks were already computed
-- live on the dashboard; this adds earned achievements with dates.
-- Awarded server-side with the user's own client on dashboard/profile load.

create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists "Users read own badges" on public.user_badges;
create policy "Users read own badges"
  on public.user_badges
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users earn own badges" on public.user_badges;
create policy "Users earn own badges"
  on public.user_badges
  for insert
  with check (auth.uid() = user_id);
