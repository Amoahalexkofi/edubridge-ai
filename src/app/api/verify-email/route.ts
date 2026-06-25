import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Verifies a user's email via our own token (stored in app_metadata.verify_token).
// Sets user_metadata.app_verified = true, then sends them to their dashboard.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  if (!uid || !token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification`);
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: got, error } = await admin.auth.admin.getUserById(uid);
  const user = got?.user;
  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification`);
  }

  // Already verified — just send them in.
  if (user.user_metadata?.app_verified === true) {
    return NextResponse.redirect(`${origin}/student?verified=1`);
  }

  const expected = (user.app_metadata as { verify_token?: string })?.verify_token;
  if (!expected || expected !== token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification`);
  }

  // Mark verified and burn the token so the link can't be reused.
  await admin.auth.admin.updateUserById(uid, {
    user_metadata: { ...user.user_metadata, app_verified: true },
    app_metadata: { ...user.app_metadata, verify_token: null },
  });

  // If they're logged in (same browser), the dashboard unlocks after a refresh;
  // otherwise they'll land on login and sign in to a verified account.
  return NextResponse.redirect(`${origin}/student?verified=1`);
}
