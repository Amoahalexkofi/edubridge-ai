import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Link2 } from "lucide-react";
import LinkParentForm from "./_components/LinkParentForm";

export default async function AdminLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all parent-student links
  const { data: links } = await supabase
    .from("parent_student")
    .select("id, parent_id, student_id");

  const allUserIds = [...new Set([
    ...(links?.map((l) => l.parent_id) ?? []),
    ...(links?.map((l) => l.student_id) ?? []),
  ])];

  const { data: profiles } = allUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", allUserIds)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  profiles?.forEach((p) => { nameMap[p.id] = p.full_name ?? "—"; });

  // Get all parents and students for the form — service role bypasses RLS
  const { data: parentRoles } = await admin.from("user_roles").select("user_id").eq("role", "parent");
  const { data: studentRoles } = await admin.from("user_roles").select("user_id").eq("role", "student");

  const parentIds = parentRoles?.map((r) => r.user_id) ?? [];
  const studentIds = studentRoles?.map((r) => r.user_id) ?? [];

  const { data: parentProfiles } = parentIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", parentIds).order("full_name")
    : { data: [] };

  const { data: studentProfiles } = studentIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds).order("full_name")
    : { data: [] };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Parent Links</h1>
        <p className="text-sm text-[#64748B] mt-1">Link parents to their wards</p>
      </div>

      {/* Add link form */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5">
        <h2 className="font-bold text-[#0f172a] mb-4">Create new link</h2>
        <LinkParentForm
          parents={parentProfiles ?? []}
          students={studentProfiles ?? []}
        />
      </div>

      {/* Existing links */}
      {links && links.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">Existing links ({links.length})</h2>
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="bg-white rounded-xl border border-[#E6E4DE] p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0f172a]">
                    <span className="text-green-600">Parent:</span> {nameMap[link.parent_id] ?? link.parent_id}
                  </p>
                  <p className="text-sm text-[#64748B] mt-0.5">
                    <span className="text-[#1D4ED8]">Student:</span> {nameMap[link.student_id] ?? link.student_id}
                  </p>
                </div>
                <Link2 className="h-4 w-4 text-[#CBD5E1]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {(!links || links.length === 0) && (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-10 text-center">
          <Link2 className="h-8 w-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155] text-sm">No parent links yet</p>
        </div>
      )}
    </div>
  );
}
