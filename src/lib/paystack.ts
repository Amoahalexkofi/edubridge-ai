// Thin server-side wrappers over the Paystack REST API. The secret key never
// leaves the server. Redirect (standard) flow: we initialize a transaction and
// send the student to Paystack's hosted checkout (supports MoMo + card).

const SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = "https://api.paystack.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function paystackInitialize(params: {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<any> {
  if (!SECRET) return { status: false, message: "Payments are not configured yet (missing Paystack key)." };
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountPesewas,
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function paystackVerify(reference: string): Promise<any> {
  if (!SECRET) return { status: false };
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  return res.json();
}
