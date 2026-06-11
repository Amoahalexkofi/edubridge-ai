import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import RoleChanger from "./_components/RoleChanger";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role: filterRole, q: search } = await searchParams;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .order("created_at", { ascending: false });

  const userIds = roles?.map((r) => r.user_id) ?? [];

  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, exam_target, school")
    .order("full_name");

  if (userIds.length > 0) {
    profileQuery = profileQuery.in("id", userIds);
  }

  const { data: profiles } = await profileQuery;

  const roleMap: Record<string, string> = {};
  roles?.forEach((r) => { roleMap[r.user_id] = r.role; });

  let combined = (profiles ?? []).map((p) => ({
    ...p,
    role: roleMap[p.id] ?? "student",
  }));

  if (filterRole) combined = combined.filter((u) => u.role === filterRole);
  if (search) {
    const q = search.toLowerCase();
    combined = combined.filter((u) => (u.full_name ?? "").toLowerCase().includes(q));
  }

  const roleTabs = [
    { label: "All",     value: "" },
    { label: "Student", value: "student" },
    { label: "Teacher", value: "teacher" },
    { label: "Parent",  value: "parent" },
    { label: "Admin",   value: "admin" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Users</h1>
        <p className="text-sm text-[#64748B] mt-1">{combined.length} users</p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by name…"
          className="flex-1 h-10 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all"
        />
        {filterRole && <input type="hidden" name="role" value={filterRole} />}
      </form>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {roleTabs.map((t) => (
          <a
            key={t.value}
            href={t.value ? `/admin/users?role=${t.value}` : "/admin/users"}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              (filterRole ?? "") === t.value
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Users table */}
      {combined.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="divide-y divide-[#F1F5F9]">
            {combined.map((u) => {
              const initials = (u.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="h-9 w-9 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{u.full_name ?? "—"}</p>
                    <p className="text-xs text-[#94a3b8]">{u.school ?? "—"} · {u.exam_target ?? "—"}</p>
                  </div>
                  <RoleChanger userId={u.id} currentRole={u.role} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-14 text-center">
          <Users className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155]">No users found</p>
        </div>
      )}
    </div>
  );
}
