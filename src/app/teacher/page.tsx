import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  BookOpen, PenLine, FileText, Users,
  ArrowRight, Plus, TrendingUp,
} from "lucide-react";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Teacher";
  const levelLabel = profile?.exam_target === "wassce" ? "SHS Teacher" : profile?.exam_target === "bece" ? "JHS Teacher" : null;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Stats
  const { count: subjectCount } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true });

  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true });

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  // Service role bypasses RLS so count reflects all students, not just caller's row
  const { count: studentCount } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const stats = [
    { label: "Subjects",   value: subjectCount  ?? 0, icon: BookOpen,  href: "/teacher/subjects",  color: "bg-blue-50 text-blue-600" },
    { label: "Lessons",    value: lessonCount   ?? 0, icon: FileText,  href: "/teacher/lessons",   color: "bg-purple-50 text-purple-600" },
    { label: "Questions",  value: questionCount ?? 0, icon: PenLine,   href: "/teacher/questions", color: "bg-orange-50 text-[#E8722A]" },
    { label: "Students",   value: studentCount  ?? 0, icon: Users,     href: "/teacher/students",  color: "bg-green-50 text-green-600" },
  ];

  const quickActions = [
    { href: "/teacher/lessons/new",   label: "Create lesson",   desc: "Add content for a topic",       icon: FileText, bg: "bg-purple-600" },
    { href: "/teacher/questions/new", label: "Add questions",   desc: "Build the question bank",       icon: PenLine,  bg: "bg-[#E8722A]" },
    { href: "/teacher/subjects",      label: "Manage subjects", desc: "Topics and curriculum",         icon: BookOpen, bg: "bg-[#1B3A8A]" },
    { href: "/teacher/students",      label: "View progress",   desc: "See how students are doing",    icon: TrendingUp, bg: "bg-green-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

      {/* Greeting */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          {levelLabel && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#E8722A] border border-orange-100">
              {levelLabel}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s an overview of EduBridge content.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E4DE] flex flex-col gap-3 hover:border-[#E8722A]/30 hover:shadow-sm transition-all group">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickActions.map(({ href, label, desc, icon: Icon, bg }) => (
            <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8F7F4] transition-colors group">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA if no content yet */}
      {(lessonCount ?? 0) === 0 && (
        <div className="bg-gradient-to-r from-[#E8722A] to-[#d4641e] rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">Start building content</h3>
          <p className="text-orange-100 text-sm mb-4 leading-relaxed">
            Add subjects, create topics, write lessons and upload questions to help students prepare for their exams.
          </p>
          <Link
            href="/teacher/subjects"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#E8722A] font-bold text-sm rounded-xl hover:bg-orange-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add first subject
          </Link>
        </div>
      )}
    </div>
  );
}
