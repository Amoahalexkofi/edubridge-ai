import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, PenLine, FileText, TrendingUp,
  ArrowRight, ChevronRight, Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Subject icon colours — fallback palette
const subjectColors: Record<string, string> = {
  mathematics:    "bg-blue-50   text-blue-600   border-blue-100",
  english:        "bg-green-50  text-green-600  border-green-100",
  science:        "bg-purple-50 text-purple-600 border-purple-100",
  "social studies":"bg-orange-50 text-orange-600 border-orange-100",
  ict:            "bg-cyan-50   text-cyan-600   border-cyan-100",
  history:        "bg-amber-50  text-amber-600  border-amber-100",
  geography:      "bg-teal-50   text-teal-600   border-teal-100",
  economics:      "bg-rose-50   text-rose-600   border-rose-100",
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

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const examTarget: string = profile?.exam_target ?? "BECE";

  // Fetch subjects for this student's exam type
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, color, description")
    .eq("exam_type", examTarget)
    .order("name");

  // Lessons completed
  const { count: lessonsCompleted } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true);

  // Mock exams taken
  const { count: examsTaken } = await supabase
    .from("exam_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "submitted");

  // Average exam score
  const { data: examScores } = await supabase
    .from("exam_attempts")
    .select("score, total_marks")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .not("score", "is", null);

  const avgScore = examScores && examScores.length > 0
    ? Math.round(examScores.reduce((sum, e) => sum + (e.score / e.total_marks) * 100, 0) / examScores.length)
    : null;

  // Last viewed lesson
  const { data: recentProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, last_viewed_at, completed, lessons(title, topic_id, topics(name, subject_id, subjects(name, slug)))")
    .eq("user_id", user.id)
    .order("last_viewed_at", { ascending: false })
    .limit(1)
    .single();

  const stats = [
    {
      label: "Subjects",
      value: subjects?.length ?? 0,
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50",
      href: "/student/subjects",
    },
    {
      label: "Lessons done",
      value: lessonsCompleted ?? 0,
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
      href: "/student/subjects",
    },
    {
      label: "Mock exams",
      value: examsTaken ?? 0,
      icon: FileText,
      color: "text-purple-600 bg-purple-50",
      href: "/student/exams",
    },
    {
      label: "Avg score",
      value: avgScore != null ? `${avgScore}%` : "—",
      icon: Trophy,
      color: "text-amber-600 bg-amber-50",
      href: "/student/exams",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = recentProgress as any;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#64748B] font-medium">{greeting} 👋</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] mt-0.5">
            {firstName}
          </h1>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1D4ED8] text-white text-xs font-bold tracking-wider uppercase shadow-sm">
            {examTarget}
          </span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] flex flex-col gap-3 hover:border-[#1D4ED8]/30 hover:shadow-sm transition-all group"
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0f172a] leading-none">{value}</p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Continue learning ── */}
      {recent?.lessons && (
        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            Continue learning
          </h2>
          <Link
            href={`/student/lessons/${recent.lesson_id}`}
            className="flex items-center gap-4 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-2xl p-5 hover:from-[#1e40af] hover:to-[#1e3a8a] transition-all group"
          >
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-200 font-medium mb-0.5">
                {recent.lessons?.topics?.subjects?.name}
                {" · "}
                {recent.lessons?.topics?.name}
              </p>
              <p className="font-semibold text-white truncate">{recent.lessons?.title}</p>
            </div>
            <div className="flex items-center gap-1 text-blue-200 group-hover:text-white transition-colors flex-shrink-0">
              <span className="text-xs hidden sm:block">
                {recent.completed ? "Review" : "Continue"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      )}

      {/* ── Quick actions (shown when no recent activity) ── */}
      {!recent?.lessons && (
        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            Get started
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/student/subjects", label: "Browse subjects", desc: "Pick a topic and start learning", icon: BookOpen, color: "bg-[#EFF6FF] border-[#BFDBFE]", iconColor: "bg-[#1D4ED8] text-white" },
              { href: "/student/practice", label: "Quick practice", desc: "Answer questions on any topic", icon: PenLine, color: "bg-[#F0FDF4] border-[#BBF7D0]", iconColor: "bg-[#16A34A] text-white" },
              { href: "/student/exams", label: "Mock exam", desc: "Test yourself under timed conditions", icon: FileText, color: "bg-[#FAF5FF] border-[#E9D5FF]", iconColor: "bg-[#7C3AED] text-white" },
            ].map(({ href, label, desc, icon: Icon, color, iconColor }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${color} hover:shadow-sm transition-all group`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0f172a]">{label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#94a3b8] group-hover:text-[#0f172a] mt-0.5 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Subjects grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">
            Your subjects
          </h2>
          <Link href="/student/subjects" className="text-sm font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1">
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjects.slice(0, 6).map((subject) => (
              <Link
                key={subject.id}
                href={`/student/subjects/${subject.slug}`}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:border-[#1D4ED8]/40 hover:shadow-sm transition-all group flex flex-col gap-3"
              >
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-lg ${subjectStyle(subject.name, subject.color)}`}>
                  {subject.icon ?? "📚"}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#0f172a] leading-snug">{subject.name}</p>
                  {subject.description && (
                    <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-2">{subject.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[#1D4ED8] text-xs font-semibold mt-auto">
                  Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-[#94a3b8]" />
            </div>
            <p className="font-semibold text-[#334155] text-sm">No subjects yet</p>
            <p className="text-xs text-[#94a3b8] mt-1">
              {examTarget} subjects will appear here once an admin adds them.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
