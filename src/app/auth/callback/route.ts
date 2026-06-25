import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const roleRedirects: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  admin: "/admin",
  super_admin: "/admin",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role") ?? "student";
  const returnUrl = searchParams.get("returnUrl");
  const verify = searchParams.get("verify") === "1";
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Use service role for DB writes — bypasses RLS so role assignment always works
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Mark the email verified when arriving via the verification link, or when the
  // user signed in with Google (Google pre-verifies the address).
  const isOAuth = (user.app_metadata?.provider ?? "email") !== "email";
  if (verify || isOAuth) {
    if (user.user_metadata?.app_verified !== true) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, app_verified: true },
      });
    }
  }

  let finalRole = role;
  try {
    const { data: existing } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      await admin.from("user_roles").insert({ user_id: user.id, role });
    } else if (role !== "student" && existing.role === "student") {
      await admin.from("user_roles").update({ role }).eq("user_id", user.id);
      finalRole = role;
    } else {
      finalRole = existing.role;
    }
  } catch {
    // ignore
  }

  // Sync Google name/avatar into profiles (only fills blanks)
  const meta = user.user_metadata ?? {};
  const googleName = meta.full_name ?? meta.name ?? null;
  const googleAvatar = meta.avatar_url ?? meta.picture ?? null;
  if (googleName || googleAvatar) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    const patch: Record<string, string> = {};
    if (googleName && !existingProfile?.full_name) patch.full_name = googleName;
    if (googleAvatar && !existingProfile?.avatar_url) patch.avatar_url = googleAvatar;

    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").upsert({ id: user.id, ...patch });
    }
  }

  if (returnUrl) return NextResponse.redirect(`${origin}${returnUrl}`);
  return NextResponse.redirect(`${origin}${roleRedirects[finalRole] ?? "/student"}`);
}
