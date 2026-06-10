import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const roleParam = searchParams.get("role") ?? "student";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if this user already has a role
        const { data: existing } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (!existing) {
          // New OAuth user — assign the role they chose before clicking Google
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: roleParam,
          });
        }

        const finalRole = existing?.role ?? roleParam;
        return NextResponse.redirect(`${origin}${roleRedirects[finalRole] ?? "/student"}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
