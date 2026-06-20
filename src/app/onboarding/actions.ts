"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function saveOnboarding(data: { exam_target: string; grade_level: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.exam_target !== "bece" && data.exam_target !== "wassce") {
    return { error: "Please choose BECE or WASSCE." };
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    exam_target: data.exam_target,
    ...(data.grade_level ? { grade_level: data.grade_level } : {}),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  return { success: true };
}
