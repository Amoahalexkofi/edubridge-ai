import crypto from "crypto";
import { confirmPayment } from "@/lib/payments";

export const runtime = "nodejs";

// Paystack calls this on payment events. The signature (HMAC-SHA512 of the raw
// body with the secret key) proves it's really Paystack before we trust it.
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("Not configured", { status: 200 });

  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (signature !== expected) return new Response("Invalid signature", { status: 401 });

  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(body); } catch { return new Response("Bad payload", { status: 400 }); }

  if (event?.event === "charge.success" && event?.data?.reference) {
    await confirmPayment(event.data.reference);
  }
  return new Response("ok", { status: 200 });
}
