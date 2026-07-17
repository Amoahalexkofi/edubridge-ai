-- Atomically confirm a payment AND extend the subscription in one transaction,
-- so a crash between the two can't leave a student paid-but-without-access, and
-- retries (webhook re-delivery, page reload) self-heal. Idempotent: only the
-- first call for a pending payment applies; later calls are a no-op.

create or replace function public.confirm_and_extend_subscription(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_base timestamptz;
begin
  -- Lock the payment row; proceed only if it isn't already success.
  select * into v_payment
  from public.payments
  where reference = p_reference and status <> 'success'
  for update;

  if not found then
    return false; -- already applied, or no such pending payment
  end if;

  update public.payments
  set status = 'success', paid_at = now()
  where id = v_payment.id;

  -- Stack any unexpired time, otherwise start from now.
  select greatest(coalesce(subscription_expires_at, now()), now())
  into v_base
  from public.profiles
  where id = v_payment.user_id;
  if v_base is null then v_base := now(); end if;

  update public.profiles
  set subscription_tier = v_payment.tier,
      subscription_cycle = v_payment.cycle,
      subscription_expires_at = v_base
        + (case when v_payment.cycle = 'yearly' then interval '12 months' else interval '1 month' end)
  where id = v_payment.user_id;

  return true;
end;
$$;

grant execute on function public.confirm_and_extend_subscription(text) to service_role;
