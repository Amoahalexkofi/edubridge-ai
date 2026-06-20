import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Must be a parent
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!["parent", "admin", "super_admin"].includes(roleRow?.role ?? "")) {
    return NextResponse.json({ error: "Only parents can accept invite links" }, { status: 403 });
  }

  // Validate token
  const { data: invite } = await admin
    .from("parent_invite_tokens")
    .select("id, student_id, used, expires_at")
    .eq("token", token.toUpperCase())
    .single();

  if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  if (invite.used) return NextResponse.json({ error: "This invite link has already been used" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 410 });
  }

  // Create the link
  await admin.from("parent_student").upsert(
    { parent_id: user.id, student_id: invite.student_id },
    { onConflict: "parent_id,student_id", ignoreDuplicates: true }
  );

  // Mark token as used
  await admin
    .from("parent_invite_tokens")
    .update({ used: true })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
