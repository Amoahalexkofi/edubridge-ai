import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { paystackInitialize } from "@/lib/paystack";
import { priceGhs } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) return Response.json({ error: "Your account has no email on file." }, { status: 400 });

  const { tier, cycle } = (await req.json()) as { tier?: string; cycle?: string };
  if (tier !== "basic" && tier !== "premium") return Response.json({ error: "Invalid plan." }, { status: 400 });
  if (cycle !== "monthly" && cycle !== "yearly") return Response.json({ error: "Invalid billing cycle." }, { status: 400 });

  const amountPesewas = priceGhs(tier, cycle) * 100; // GHS → pesewas
  const reference = `eb_${randomUUID()}`;
  const origin = req.headers.get("origin") ?? "https://edubridgegh.com";

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error: insErr } = await admin.from("payments").insert({
    user_id: user.id, reference, tier, cycle, amount_pesewas: amountPesewas, status: "pending",
  });
  if (insErr) return Response.json({ error: "Could not start payment. Please try again." }, { status: 500 });

  const res = await paystackInitialize({
    email: user.email,
    amountPesewas,
    reference,
    callbackUrl: `${origin}/student/upgrade/callback`,
    metadata: { user_id: user.id, tier, cycle },
  });

  if (!res?.status || !res?.data?.authorization_url) {
    return Response.json({ error: res?.message ?? "Payment could not be started. Please try again." }, { status: 502 });
  }
  return Response.json({ authorization_url: res.data.authorization_url });
}
