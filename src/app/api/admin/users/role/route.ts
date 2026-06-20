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

  if (!["admin", "super_admin"].includes(callerRole?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json() as { userId: string; role: string };
  const validRoles = ["student", "teacher", "parent", "admin"];
  if (!userId || !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
  }

  const { error } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
