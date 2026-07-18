import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Receives browser error reports (from ErrorLogger) and records them. No auth
// required — errors happen to logged-out users too — but writes go through the
// dedup RPC so this can't flood the table.
export async function POST(req: Request) {
  let body: { message?: string; stack?: string; path?: string } | null = null;
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!body?.message) return Response.json({ ok: false }, { status: 400 });

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* logged-out is fine */ }

  try {
    await createAdminClient().rpc("log_error", {
      p_message: String(body.message).slice(0, 2000),
      p_source: "client",
      p_path: body.path ? String(body.path).slice(0, 500) : null,
      p_stack: body.stack ? String(body.stack).slice(0, 6000) : null,
      p_digest: null,
      p_user_id: userId,
      p_user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
  } catch { /* swallow */ }

  return Response.json({ ok: true });
}
