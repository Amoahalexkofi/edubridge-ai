import { createClient as createServiceClient } from "@supabase/supabase-js";
import { paystackVerify } from "./paystack";
import { periodMonths } from "./pricing";
import type { Cycle } from "./pricing";

function db() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Extend a student's access. If they still have time left, we add on top of it;
// otherwise we start from now. Upgrading sets the tier to whatever they paid for.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applySubscription(admin: any, userId: string, tier: string, cycle: Cycle) {
  const { data: p } = await admin.from("profiles").select("subscription_expires_at").eq("id", userId).single();
  const now = Date.now();
  const cur = p?.subscription_expires_at ? new Date(p.subscription_expires_at).getTime() : 0;
  const base = new Date(cur > now ? cur : now);
  base.setMonth(base.getMonth() + periodMonths(cycle));
  await admin.from("profiles").update({
    subscription_tier: tier,
    subscription_cycle: cycle,
    subscription_expires_at: base.toISOString(),
  }).eq("id", userId);
}

/**
 * Confirm a Paystack payment and apply the subscription — idempotent, so the
 * webhook and the browser callback can both call it safely (only the first one
 * to flip pending→success applies the access extension). Verifies with Paystack
 * and checks the amount to prevent tampering.
 */
export async function confirmPayment(reference: string): Promise<{ success: boolean; tier?: string; cycle?: string }> {
  const admin = db();
  const { data: payment } = await admin.from("payments").select("*").eq("reference", reference).maybeSingle();
  if (!payment) return { success: false };

  const verify = await paystackVerify(reference);
  const paid = verify?.status && verify?.data?.status === "success";
  if (!paid) return { success: false };
  if (Number(verify.data.amount) !== payment.amount_pesewas) return { success: false };

  // Atomic flip: only the caller that changes pending→success applies the extension.
  const { data: flipped } = await admin
    .from("payments")
    .update({ status: "success", paid_at: new Date().toISOString() })
    .eq("reference", reference)
    .neq("status", "success")
    .select("id");

  if (flipped && flipped.length > 0) {
    await applySubscription(admin, payment.user_id, payment.tier, payment.cycle as Cycle);
  }
  return { success: true, tier: payment.tier, cycle: payment.cycle };
}
