import { createClient as createServiceClient } from "@supabase/supabase-js";
import { paystackVerify } from "./paystack";

function db() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/**
 * Confirm a Paystack payment and apply the subscription. Idempotent — the webhook
 * and the browser callback can both call it safely. Verifies with Paystack (status,
 * amount, currency) to prevent tampering, then marks-paid + extends access in ONE
 * atomic DB transaction (confirm_and_extend_subscription) so a crash can't leave a
 * paid student without access, and retries self-heal.
 */
export async function confirmPayment(reference: string): Promise<{ success: boolean; tier?: string; cycle?: string }> {
  const admin = db();
  const { data: payment } = await admin.from("payments").select("*").eq("reference", reference).maybeSingle();
  if (!payment) return { success: false };

  const verify = await paystackVerify(reference);
  const paid = verify?.status && verify?.data?.status === "success";
  if (!paid) return { success: false };
  if (Number(verify.data.amount) !== payment.amount_pesewas) return { success: false };
  if (verify.data.currency && verify.data.currency !== payment.currency) return { success: false };

  // Atomic + idempotent: marks the payment success and extends the subscription
  // together, or not at all. Returns true if it applied now, false if already done.
  const { error } = await admin.rpc("confirm_and_extend_subscription", { p_reference: reference });
  if (error) return { success: false };

  return { success: true, tier: payment.tier, cycle: payment.cycle };
}
