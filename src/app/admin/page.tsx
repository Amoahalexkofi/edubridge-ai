import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Users, BookOpen, PenLine, FileText, TrendingUp, ArrowRight } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Service role bypasses RLS so counts reflect all users, not just the caller's own row
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalSubjects },
    { count: totalLessons },
    { count: totalQuestions },
    { count: totalAttempts },
  ] = await Promise.all([
    admin.from("user_roles").select("*", { count: "exact", head: true }),
    admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
    admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
    admin.from("subjects").select("*", { count: "exact", head: true }),
    admin.from("lessons").select("*", { count: "exact", head: true }),
    admin.from("questions").select("*", { count: "exact", head: true }),
    admin.from("exam_attempts").select("*", { count: "exact", head: true }).eq("status", "submitted"),
  ]);

  const stats = [
    { label: "Total users",   value: totalUsers    ?? 0, icon: Users,    href: "/admin/users",    color: "from-slate-500 to-slate-600" },
    { label: "Students",      value: totalStudents  ?? 0, icon: BookOpen, href: "/admin/users",    color: "from-blue-500 to-blue-600" },
    { label: "Teachers",      value: totalTeachers  ?? 0, icon: Users,   href: "/admin/users",    color: "from-orange-500 to-orange-600" },
    { label: "Subjects",      value: totalSubjects  ?? 0, icon: BookOpen, href: "/admin/subjects", color: "from-violet-500 to-violet-600" },
    { label: "Lessons",       value: totalLessons   ?? 0, icon: FileText, href: "/admin/subjects", color: "from-emerald-500 to-emerald-600" },
    { label: "Questions",     value: totalQuestions ?? 0, icon: PenLine,  href: "/admin/subjects", color: "from-amber-500 to-amber-600" },
    { label: "Exams taken",   value: totalAttempts  ?? 0, icon: TrendingUp, href: "/admin/users",  color: "from-rose-500 to-rose-600" },
  ];

  const quickLinks = [
    { href: "/admin/users",    label: "Manage users",      desc: "Change roles, view accounts" },
    { href: "/admin/subjects", label: "Manage subjects",   desc: "Add/edit curriculum content" },
    { href: "/admin/links",    label: "Parent links",      desc: "Link parents to their wards" },
    { href: "/teacher",        label: "Teacher view",      desc: "Preview as a teacher" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and management</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl p-4 border border-[#E6E4DE] eb-card eb-lift flex flex-col gap-2 hover:border-slate-300">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 font-medium leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3">
        {quickLinks.map(({ href, label, desc }) => (
          <Link key={href} href={href} className="bg-white rounded-2xl border border-[#E6E4DE] eb-card eb-lift p-4 flex items-center gap-3 hover:border-slate-300 group">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
