import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function generateToken(): string {
  // No 0/O/I/1 to avoid confusion when read aloud or typed
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check role is student
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleRow?.role !== "student") {
    return NextResponse.json({ error: "Only students can generate invite links" }, { status: 403 });
  }

  // Generate unique token (retry on collision)
  let token = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateToken();
    const { data: existing } = await admin
      .from("parent_invite_tokens")
      .select("id")
      .eq("token", candidate)
      .single();
    if (!existing) { token = candidate; break; }
  }
  if (!token) return NextResponse.json({ error: "Could not generate token" }, { status: 500 });

  // Delete any existing unused token for this student
  await admin
    .from("parent_invite_tokens")
    .delete()
    .eq("student_id", user.id)
    .eq("used", false);

  // Insert new token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("parent_invite_tokens").insert({
    student_id: user.id,
    token,
    expires_at: expiresAt,
  });

  return NextResponse.json({ token });
}
