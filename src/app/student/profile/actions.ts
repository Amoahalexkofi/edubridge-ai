"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { normalizePhone, matchParentStudent } from "@/lib/phone";

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5 MB" };
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return { error: "Only JPG, PNG, WebP or GIF allowed" };
  }

  // Use service role to bypass RLS on storage
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Extension from MIME type (filenames from some phones lack one)
    const extByType: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    };
    const ext = extByType[file.type] ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, bytes, { upsert: true, contentType: file.type });

    if (uploadError) return { error: uploadError.message };

    const { data: { publicUrl } } = admin.storage
      .from("avatars")
      .getPublicUrl(path);

    const bustedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await admin
      .from("profiles")
      .update({ avatar_url: bustedUrl })
      .eq("id", user.id);

    if (dbError) return { error: dbError.message };

    return { url: bustedUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function saveStudentProfile(data: {
  full_name: string;
  exam_target: string;
  phone: string;
  parent_phone: string;
  school: string;
  grade_level: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const normPhone = data.phone ? normalizePhone(data.phone) : null;
  const normParentPhone = data.parent_phone ? normalizePhone(data.parent_phone) : null;

  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    full_name: data.full_name,
    exam_target: data.exam_target,
    phone: normPhone ?? data.phone,
    parent_phone: normParentPhone ?? data.parent_phone,
    school: data.school,
    grade_level: data.grade_level,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  // Re-run matching whenever parent_phone changes
  await matchParentStudent(admin, user.id, "student", normPhone, normParentPhone);

  return { success: true };
}
