"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { normalizePhone, matchParentStudent } from "@/lib/phone";

export async function saveParentPhone(phone: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const norm = normalizePhone(phone);
  if (!norm) return { error: "Invalid phone number" };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin
    .from("profiles")
    .upsert({ id: user.id, phone: norm, updated_at: new Date().toISOString() });

  if (error) return { error: error.message };

  // Auto-link to any students who have this number as parent_phone
  await matchParentStudent(admin, user.id, "parent", norm, null);

  return { success: true };
}
