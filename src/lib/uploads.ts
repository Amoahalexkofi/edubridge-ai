"use server";

import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Uploads a lesson/question diagram to the public `content-images` bucket and
 * returns its public URL. Used by the lesson editor's "Insert image" button and
 * the question diagram field. Content authors only (teacher/admin/super_admin).
 */
export async function uploadContentImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided" };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5 MB" };
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "Only JPG, PNG, WebP or GIF allowed" };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Only content authors may upload
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!["teacher", "admin", "super_admin"].includes(role?.role ?? "")) {
    return { error: "You don't have permission to upload content images." };
  }

  try {
    // Unique-ish path without Math.random (stable per upload): user + size + name
    const safeName = (file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-40);
    const path = `${user.id}/${Date.now()}-${safeName}.${ext}`.replace(/\.[^.]*\.([a-z]+)$/, ".$1");
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from("content-images")
      .upload(path, bytes, { upsert: false, contentType: file.type });
    if (uploadError) return { error: uploadError.message };

    const { data: { publicUrl } } = admin.storage.from("content-images").getPublicUrl(path);
    return { url: publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}
