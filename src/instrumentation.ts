import { createClient } from "@supabase/supabase-js";

// Next.js calls this for every uncaught server error (route handlers, RSC, etc.).
// We record it to the error_logs table so failures are visible on the admin
// dashboard instead of only living in Vercel's logs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestError(err: any, request: { path?: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return; // Supabase client needs Node
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await admin.rpc("log_error", {
      p_message: String(err?.message ?? "Unknown server error"),
      p_source: "server",
      p_path: request?.path ?? null,
      p_stack: err?.stack ? String(err.stack) : null,
      p_digest: err?.digest ? String(err.digest) : null,
      p_user_id: null,
      p_user_agent: null,
    });
  } catch {
    // Never let logging break the request path.
  }
}
