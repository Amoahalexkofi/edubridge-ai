-- Grandfather every account that already existed when the free trial was
-- introduced: permanent full access, no trial countdown. Only accounts
-- created from here on go through the 14-day trial (column default on
-- profiles.trial_ends_at).

alter table public.profiles
  add column if not exists grandfathered boolean not null default false;

update public.profiles
set grandfathered = true,
    trial_ends_at = null
where created_at <= now();
