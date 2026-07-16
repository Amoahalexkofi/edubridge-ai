import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ~100 years — effectively permanent until an admin reactivates.
const BAN_DURATION = "876000h";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Caller must be an admin
  const admin = createAdminClient();
  const { data: callerRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const caller = callerRole?.role ?? "";
  if (!["admin", "super_admin"].includes(caller)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const callerIsSuper = caller === "super_admin";

  const { userId, deactivate } = await req.json() as { userId: string; deactivate: boolean };
  if (!userId || typeof deactivate !== "boolean") {
    return NextResponse.json({ error: "Missing userId or deactivate flag" }, { status: 400 });
  }

  // Safety: an admin can't deactivate their own account.
  if (userId === user.id) {
    return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
  }

  // Protect elevated accounts: super admins are untouchable here; only a super
  // admin may deactivate a fellow admin.
  const { data: targetRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  const targetRole = targetRow?.role ?? "student";
  if (targetRole === "super_admin") {
    return NextResponse.json({ error: "Super admin accounts can't be deactivated here." }, { status: 403 });
  }
  if (targetRole === "admin" && !callerIsSuper) {
    return NextResponse.json({ error: "Only a super admin can deactivate an admin." }, { status: 403 });
  }

  // Soft deactivate via auth ban (reversible). ban_duration "none" reactivates.
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: deactivate ? BAN_DURATION : "none",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, deactivated: deactivate });
}
