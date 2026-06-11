import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, PenLine, FileText, TrendingUp,
  ArrowRight, ChevronRight, Trophy, Flame,
  Brain, Zap, Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const subjectColors: Record<string, string> = {
  mathematics:     "bg-blue-50   text-blue-600   border-blue-100",
  english:         "bg-emerald-50 text-emerald-600 border-emerald-100",
  science:         "bg-purple-50 text-purple-600 border-purple-100",
  "social studies":"bg-orange-50 text-orange-600 border-orange-100",
  ict:             "bg-cyan-50   text-cyan-600   border-cyan-100",
  history:         "bg-amber-50  text-amber-600  border-amber-100",
  geography:       "bg-teal-50   text-teal-600   border-teal-100",
  economics:       "bg-rose-50   text-rose-600   border-rose-100",
  physics:         "bg-indigo-50 text-indigo-600 border-indigo-100",
  chemistry:       "bg-pink-50   text-pink-600   border-pink-100",
  biology:         "bg-green-50  text-green-600  border-green-100",
};

function subjectStyle(name: string, color?: string | null) {
  if (color) return `bg-[${color}]/10 text-[${color}] border-[${color}]/20`;
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(subjectColors)) {
    if (key.includes(k)) return v;
  }
  return "bg-slate-50 text-slate-600 border-slate-100";
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const examTarget: string = profile?.exam_target ?? "BECE";

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, color, description")
    .eq("exam_type", examTarget.toLowerCase())
    .order("name");

  const { count: lessonsCompleted } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true);

  const { count: examsTaken } = await supabase
    .from("exam_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "submitted");

  const { data: examScores } = await supabase
    .from("exam_attempts")
    .select("score, total_marks")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .not("score", "is", null);

  const avgScore = examScores && examScores.length > 0
    ? Math.round(examScores.reduce((sum, e) => sum + (e.score / e.total_marks) * 100, 0) / examScores.length)
    : null;

  const { data: recentProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, last_viewed_at, completed, lessons(title, topic_id, topics(name, subject_id, subjects(name, slug)))")
    .eq("user_id", user.id)
    .order("last_viewed_at", { ascending: false })
    .limit(1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = recentProgress as any;

  const stats = [
    { label: "Subjects",     value: subjects?.length ?? 0,          icon: BookOpen,   color: "bg-blue-50 text-blue-600",   href: "/student/subjects" },
    { label: "Lessons done", value: lessonsCompleted ?? 0,           icon: TrendingUp, color: "bg-green-50 text-green-600", href: "/student/subjects" },
    { label: "Mock exams",   value: examsTaken ?? 0,                 icon: FileText,   color: "bg-purple-50 text-purple-600", href: "/student/exams" },
    { label: "Avg score",    value: avgScore != null ? `${avgScore}%` : "—", icon: Trophy, color: "bg-amber-50 text-amber-600", href: "/student/exams" },
  ];

  const quickActions = [
    { href: "/student/subjects", label: "Browse subjects",  desc: "Explore all topics", icon: BookOpen, bg: "bg-[#1B3A8A]" },
    { href: "/student/practice", label: "Quick practice",   desc: "Sharpen your skills", icon: PenLine,  bg: "bg-[#E8722A]" },
    { href: "/student/exams",    label: "Start mock exam",  desc: "WAEC-style timed paper", icon: FileText, bg: "bg-purple-600" },
    { href: "/student/ai-tutor", label: "Ask AI Tutor",    desc: "Get instant help", icon: Brain,    bg: "bg-teal-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
            {greeting} <span>👋</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8722A]/10 border border-[#E8722A]/20">
            <Flame className="h-3.5 w-3.5 text-[#E8722A]" />
            <span className="text-xs font-bold text-[#E8722A]">0 day streak</span>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-[#1B3A8A] text-white text-xs font-bold tracking-wider uppercase shadow-sm">
            {examTarget}
          </span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col gap-3 hover:border-[#1B3A8A]/30 hover:shadow-sm transition-all group"
          >
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

      {/* ── Continue learning / Get started ── */}
      {recent?.lessons ? (
        <Link
          href={`/student/lessons/${recent.lesson_id}`}
          className="flex items-center gap-4 bg-gradient-to-r from-[#1B3A8A] to-[#2d4fa0] text-white rounded-2xl p-5 hover:from-[#162f74] hover:to-[#1B3A8A] transition-all group mb-6 shadow-md"
        >
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-200 font-semibold mb-0.5 uppercase tracking-wide">
              Continue learning
            </p>
            <p className="text-xs text-blue-200/70 mb-1">
              {recent.lessons?.topics?.subjects?.name} · {recent.lessons?.topics?.name}
            </p>
            <p className="font-bold text-white truncate text-lg">{recent.lessons?.title}</p>
          </div>
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/15 group-hover:bg-[#E8722A] flex items-center justify-center transition-colors">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </Link>
      ) : (
        <div className="bg-gradient-to-r from-[#1B3A8A] to-[#2d4fa0] rounded-2xl p-6 mb-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#E8722A]" />
            </div>
            <div>
              <p className="text-white font-bold">Welcome to EduBridge AI!</p>
              <p className="text-blue-200 text-sm">Start your {examTarget} preparation journey</p>
            </div>
          </div>
          <Link href="/student/subjects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
            Browse subjects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ── Two column layout ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Subjects ── */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Your subjects</h2>
              <Link href="/student/subjects" className="text-sm font-semibold text-[#1B3A8A] hover:underline flex items-center gap-0.5">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {subjects && subjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {subjects.slice(0, 6).map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/student/subjects/${subject.slug}`}
                    className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#1B3A8A]/40 hover:shadow-sm transition-all group flex flex-col gap-3"
                  >
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-lg ${subjectStyle(subject.name, subject.color)}`}>
                      {subject.icon ?? "📚"}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900 leading-snug">{subject.name}</p>
                      {subject.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{subject.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#1B3A8A] text-xs font-semibold">
                      Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-slate-300" />
                </div>
                <p className="font-bold text-slate-700 text-sm">No subjects yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  {examTarget} subjects will appear here once an admin adds them.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Sidebar widgets ── */}
        <div className="space-y-4">

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Quick actions</h3>
            <div className="space-y-2">
              {quickActions.map(({ href, label, desc, icon: Icon, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* XP / Level widget */}
          <div className="bg-[#1B3A8A] rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#E8722A]" />
                <span className="text-sm font-bold">Level 1 · Beginner</span>
              </div>
              <span className="text-xs text-white/50">0 / 500 XP</span>
            </div>
            <div className="h-2 bg-white/15 rounded-full mb-3">
              <div className="h-full bg-[#E8722A] rounded-full w-0" />
            </div>
            <p className="text-xs text-white/50">Complete lessons to earn XP and level up!</p>
          </div>

          {/* Leaderboard teaser */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Leaderboard</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { name: "Akosua M.", xp: "4,820 XP", rank: 1 },
                { name: "Kwame O.", xp: "4,510 XP", rank: 2 },
                { name: "Yaa A.",   xp: "4,270 XP", rank: 3 },
              ].map((l) => (
                <div key={l.name} className="flex items-center gap-2.5">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    l.rank === 1 ? "bg-amber-400 text-white" : l.rank === 2 ? "bg-slate-300 text-slate-700" : "bg-amber-700/20 text-amber-800"
                  }`}>{l.rank}</div>
                  <span className="flex-1 text-sm text-slate-700 font-medium">{l.name}</span>
                  <span className="text-xs font-bold text-[#E8722A]">{l.xp}</span>
                </div>
              ))}
            </div>
            <Link href="/student/leaderboard" className="mt-3 text-xs text-[#1B3A8A] font-semibold hover:underline flex items-center gap-0.5">
              View full leaderboard <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
