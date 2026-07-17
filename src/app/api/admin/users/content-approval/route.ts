import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins / super_admins may approve content authors.
  const admin = createAdminClient();
  const { data: callerRole } = await admin
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!["admin", "super_admin"].includes(callerRole?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, approved } = (await req.json()) as { userId: string; approved: boolean };
  if (!userId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Missing userId or approved flag" }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ content_approved: approved })
    .eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, approved });
}
