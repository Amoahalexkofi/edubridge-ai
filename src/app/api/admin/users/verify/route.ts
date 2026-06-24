import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller is an admin
  const admin = createAdminClient();
  const { data: callerRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!["admin", "super_admin"].includes(callerRole?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json() as { userId: string };
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Manually confirm the user's email
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
