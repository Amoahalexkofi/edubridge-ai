import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Users, AlertTriangle } from "lucide-react";
import RoleChanger from "./_components/RoleChanger";
import VerifyButton from "./_components/VerifyButton";
import DeactivateButton from "./_components/DeactivateButton";

const roleColors: Record<string, string> = {
  student: "bg-blue-50 text-blue-700",
  teacher: "bg-orange-50 text-orange-700",
  parent:  "bg-green-50 text-green-700",
  admin:   "bg-purple-50 text-purple-700",
};

const roleTabs = [
  { label: "All",     value: "" },
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Parents",  value: "parent" },
  { label: "Admins",   value: "admin" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { role: filterRole, q: search } = await searchParams;
  const admin = createAdminClient();

  const [{ data: roles }, { data: profiles }, { data: authData }] = await Promise.all([
    admin.from("user_roles").select("user_id, role"),
    admin.from("profiles").select("id, full_name, exam_target, school, created_at").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers(),
  ]);

  const roleMap: Record<string, string> = {};
  roles?.forEach((r) => { roleMap[r.user_id] = r.role; });

  const authMap: Record<string, { email: string; verified: boolean; deactivated: boolean }> = {};
  authData?.users?.forEach((u) => {
    // banned_until set and in the future ⇒ account is deactivated
    const bannedUntil = (u as { banned_until?: string }).banned_until;
    const deactivated = !!bannedUntil && new Date(bannedUntil) > new Date();
    authMap[u.id] = { email: u.email ?? "", verified: !!u.email_confirmed_at, deactivated };
  });

  let combined = (profiles ?? []).map((p) => ({
    ...p,
    role: roleMap[p.id] ?? "student",
    email: authMap[p.id]?.email ?? "",
    verified: authMap[p.id]?.verified ?? false,
    deactivated: authMap[p.id]?.deactivated ?? false,
  }));

  if (filterRole) combined = combined.filter((u) => u.role === filterRole);
  if (search) {
    const q = search.toLowerCase();
    combined = combined.filter((u) =>
      (u.full_name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  const unverifiedCount = combined.filter((u) => !u.verified).length;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function initials(name: string) {
    return (name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  const avatarColors: Record<string, string> = {
    student: "bg-blue-600",
    teacher: "bg-orange-500",
    parent:  "bg-green-600",
    admin:   "bg-purple-600",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{combined.length} total members</p>
        </div>
        {unverifiedCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {unverifiedCount} unverified email{unverifiedCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Search by name or email…"
            className="w-full h-10 px-4 rounded-xl border border-[#E6E4DE] bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
          {filterRole && <input type="hidden" name="role" value={filterRole} />}
        </form>

        {/* Role filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {roleTabs.map((t) => (
            <a
              key={t.value}
              href={t.value ? `/admin/users?role=${t.value}` : "/admin/users"}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                (filterRole ?? "") === t.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-[#E6E4DE] hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      {combined.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-sm">

          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-[#F8F7F4] border-b border-[#E6E4DE] text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-t-2xl">
            <span>User</span>
            <span>Email</span>
            <span>Exam</span>
            <span>Joined</span>
            <span>Role</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {combined.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-[#F8F7F4] transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColors[u.role] ?? "bg-[#F8F7F4]0"}`}>
                    {initials(u.full_name ?? "")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{u.full_name ?? "—"}</p>
                      {u.deactivated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Deactivated
                        </span>
                      )}
                    </div>
                    {!u.verified && <VerifyButton userId={u.id} />}
                  </div>
                </div>

                {/* Email */}
                <p className="text-sm text-slate-500 truncate">{u.email || "—"}</p>

                {/* Exam */}
                <div>
                  {u.exam_target ? (
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${roleColors[u.role] ?? "bg-[#F1F0EC] text-slate-600"}`}>
                      {u.exam_target}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>

                {/* Joined */}
                <p className="text-xs text-slate-400">{formatDate(u.created_at)}</p>

                {/* Role + actions */}
                <div className="flex items-center gap-2 justify-end">
                  <RoleChanger userId={u.id} currentRole={u.role} />
                  <DeactivateButton userId={u.id} deactivated={u.deactivated} isSelf={u.id === user.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-16 text-center">
          <div className="h-12 w-12 rounded-2xl bg-[#F8F7F4] flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-700">No users found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
