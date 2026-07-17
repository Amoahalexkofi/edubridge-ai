-- Student subscriptions (Basic / Premium) via Paystack one-time payments that
-- extend access. Enforcement stays OFF during the pilot (see NEXT_PUBLIC_PAYMENTS_ENFORCED)
-- so nobody is locked out until launch.

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists subscription_cycle text,
  add column if not exists subscription_expires_at timestamptz;

-- Payment/transaction ledger (audit + idempotency via unique reference).
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  tier text not null,               -- basic | premium
  cycle text not null,              -- monthly | yearly
  amount_pesewas int not null,      -- GHS * 100
  currency text not null default 'GHS',
  status text not null default 'pending',  -- pending | success | failed
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;

-- Students can see their own payment history; all writes go through the
-- server (service role), so no user insert/update policy is needed.
drop policy if exists "Users see their own payments" on public.payments;
create policy "Users see their own payments" on public.payments
  for select to authenticated using (auth.uid() = user_id);
