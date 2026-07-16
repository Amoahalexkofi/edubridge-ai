import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller is admin
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

  const { userId, role } = await req.json() as { userId: string; role: string };
  // super_admin is intentionally NOT assignable through the UI/API — it's set
  // directly in the database to prevent accidental or malicious proliferation.
  const validRoles = ["student", "teacher", "parent", "admin"];
  if (!userId || !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
  }

  // The target's current role governs who may change it.
  const { data: targetRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  const targetRole = targetRow?.role ?? "student";

  // Super admin accounts can never be changed here — protects the owner.
  if (targetRole === "super_admin") {
    return NextResponse.json({ error: "Super admin accounts can only be changed directly in the database." }, { status: 403 });
  }
  // Only a super admin may grant admin, or change anyone who is already an admin.
  if ((role === "admin" || targetRole === "admin") && !callerIsSuper) {
    return NextResponse.json({ error: "Only a super admin can create or change admins." }, { status: 403 });
  }

  // The table's unique key is (user_id, role), not user_id alone, so an
  // ON CONFLICT(user_id) upsert has nothing to match. Clear the user's existing
  // role(s) and set the new one — guarantees exactly one role per user.
  const { error: delError } = await admin.from("user_roles").delete().eq("user_id", userId);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
