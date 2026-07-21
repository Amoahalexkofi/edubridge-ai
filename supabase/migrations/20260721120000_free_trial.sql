-- 14-day free trial. Every new account gets full Premium access for 14 days
-- (column default), after which entitlements fall back to Free unless they've
-- subscribed. Existing accounts are grandfathered with a fresh 14-day trial.

alter table public.profiles
  add column if not exists trial_ends_at timestamptz default (now() + interval '14 days');

-- Backfill any rows that predate the default (belt-and-suspenders for re-runs).
update public.profiles
set trial_ends_at = now() + interval '14 days'
where trial_ends_at is null;
