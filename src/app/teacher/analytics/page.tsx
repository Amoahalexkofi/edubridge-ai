import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Users, BookOpen, Trophy, TrendingUp, AlertCircle, CheckCircle2, BarChart2 } from "lucide-react";

export default async function TeacherAnalyticsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: studentRoles },
    { data: allProfiles },
    { data: allProgress },
    { data: recentProgress },
    { data: allAttempts },
    { data: subjects },
    { data: lessons },
  ] = await Promise.all([
    admin.from("user_roles").select("user_id").eq("role", "student"),
    admin.from("profiles").select("id, full_name, exam_target, grade_level, school"),
    admin.from("lesson_progress").select("user_id, lesson_id").eq("completed", true),
    admin.from("lesson_progress").select("user_id").eq("completed", true).gte("last_viewed_at", sevenDaysAgo),
    admin.from("exam_attempts").select("user_id, subject_id, score, total_marks, submitted_at").eq("status", "submitted"),
    admin.from("subjects").select("id, name, exam_type"),
    admin.from("lessons").select("id, topic_id, title"),
  ]);

  const studentIds = new Set((studentRoles ?? []).map(r => r.user_id));
  const studentProfiles = (allProfiles ?? []).filter(p => studentIds.has(p.id));
  const totalStudents = studentProfiles.length;
  const activeThisWeek = new Set((recentProgress ?? []).map(p => p.user_id)).size;

  // Per-student stats
  const completionMap: Record<string, number> = {};
  (allProgress ?? []).forEach(p => { completionMap[p.user_id] = (completionMap[p.user_id] ?? 0) + 1; });

  const examScoreMap: Record<string, { total: number; count: number }> = {};
  (allAttempts ?? []).forEach(a => {
    if (a.score == null || a.total_marks == null) return;
    if (!examScoreMap[a.user_id]) examScoreMap[a.user_id] = { total: 0, count: 0 };
    examScoreMap[a.user_id].total += (a.score! / a.total_marks!) * 100;
    examScoreMap[a.user_id].count++;
  });

  // Students needing attention (0 completions or avg < 50%)
  const needsAttention = studentProfiles
    .map(p => ({
      ...p,
      lessons: completionMap[p.id] ?? 0,
      avg: examScoreMap[p.id]
        ? Math.round(examScoreMap[p.id].total / examScoreMap[p.id].count)
        : null,
    }))
    .filter(p => p.lessons === 0 || (p.avg != null && p.avg < 50))
    .slice(0, 8);

  // Top performers
  const topStudents = studentProfiles
    .map(p => ({
      ...p,
      lessons: completionMap[p.id] ?? 0,
      avg: examScoreMap[p.id]
        ? Math.round(examScoreMap[p.id].total / examScoreMap[p.id].count)
        : null,
    }))
    .sort((a, b) => b.lessons - a.lessons)
    .slice(0, 5);
  const topMax = topStudents[0]?.lessons ?? 1;

  // Subject performance from exam attempts — exam_attempts has subject_id directly
  const subjectStats: Record<string, { name: string; type: string; total: number; count: number }> = {};
  (allAttempts ?? []).forEach(a => {
    if (a.score == null || a.total_marks == null) return;
    const subj = subjects?.find(s => s.id === a.subject_id);
    if (!subj) return;
    if (!subjectStats[subj.id]) subjectStats[subj.id] = { name: subj.name, type: subj.exam_type, total: 0, count: 0 };
    subjectStats[subj.id].total += (a.score! / a.total_marks!) * 100;
    subjectStats[subj.id].count++;
  });
  const subjectPerf = Object.values(subjectStats)
    .map(s => ({ ...s, avg: Math.round(s.total / s.count) }))
    .sort((a, b) => a.avg - b.avg); // weakest first

  // Grade breakdown
  const gradeMap: Record<string, { students: number; completions: number }> = {};
  studentProfiles.forEach(p => {
    const g = p.grade_level ?? "Unknown";
    if (!gradeMap[g]) gradeMap[g] = { students: 0, completions: 0 };
    gradeMap[g].students++;
    gradeMap[g].completions += completionMap[p.id] ?? 0;
  });
  const gradeEntries = Object.entries(gradeMap).sort((a, b) => a[0].localeCompare(b[0]));

  function initials(name?: string | null) {
    return (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }
  function scoreColor(n: number) {
    if (n >= 70) return "text-green-600";
    if (n >= 50) return "text-amber-600";
    return "text-red-500";
  }
  function scoreBarColor(n: number) {
    if (n >= 70) return "bg-green-500";
    if (n >= 50) return "bg-amber-400";
    return "bg-red-400";
  }

  const engagementRate = totalStudents > 0
    ? Math.round((Object.keys(completionMap).length / totalStudents) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-1">Student engagement and subject performance</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total students",    value: totalStudents,                 icon: Users,        color: "bg-blue-50 text-blue-600"   },
          { label: "Active this week",  value: activeThisWeek,                icon: TrendingUp,   color: "bg-green-50 text-green-600" },
          { label: "Engagement rate",   value: `${engagementRate}%`,          icon: BarChart2,    color: "bg-orange-50 text-[#E8722A]"},
          { label: "Exams submitted",   value: allAttempts?.length ?? 0,      icon: Trophy,       color: "bg-purple-50 text-purple-600"},
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-3xl font-black text-[#0f172a] tabular-nums leading-none">{value}</p>
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Top performers + Needs attention */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Top 5 */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">Top performers</h2>
          </div>
          {topStudents.length > 0 ? topStudents.map(({ id, full_name, lessons, avg, grade_level }, idx) => (
            <div key={id} className="flex items-center gap-3">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                idx === 0 ? "bg-yellow-400 text-yellow-900" :
                idx === 1 ? "bg-slate-200 text-slate-600" :
                idx === 2 ? "bg-orange-300 text-orange-900" : "bg-[#F2F1EE] text-[#64748B]"
              }`}>
                {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
              </div>
              <div className="h-8 w-8 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials(full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{full_name ?? "—"}</p>
                <p className="text-[11px] text-[#94a3b8]">{grade_level ?? "—"} · {lessons} lessons</p>
              </div>
              {avg != null && (
                <span className={`text-sm font-black tabular-nums ${scoreColor(avg)}`}>{avg}%</span>
              )}
            </div>
          )) : (
            <p className="text-sm text-[#94a3b8] text-center py-6">No lesson completions yet</p>
          )}
        </div>

        {/* Needs attention */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold text-[#0f172a] text-sm">Needs attention</h2>
            <span className="text-xs text-[#94a3b8] ml-auto">0 lessons or score below 50%</span>
          </div>
          {needsAttention.length > 0 ? needsAttention.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                {initials(p.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{p.full_name ?? "—"}</p>
                <p className="text-[11px] text-[#94a3b8]">{p.grade_level ?? "—"} · {p.lessons} lessons done</p>
              </div>
              {p.avg != null ? (
                <span className={`text-sm font-black tabular-nums ${scoreColor(p.avg)}`}>{p.avg}%</span>
              ) : (
                <span className="text-xs text-[#CBD5E1] italic">no exams</span>
              )}
            </div>
          )) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <p className="text-sm font-semibold text-green-600">All students on track</p>
            </div>
          )}
        </div>
      </div>

      {/* Subject performance */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#94a3b8]" />
          <h2 className="font-bold text-[#0f172a] text-sm">Subject performance</h2>
          <span className="text-xs text-[#94a3b8] ml-auto">Weakest first — based on exam scores</span>
        </div>
        {subjectPerf.length > 0 ? (
          <div className="space-y-3">
            {subjectPerf.map(({ name, type, avg, count }) => (
              <div key={name} className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 w-14 text-center ${type === "bece" ? "bg-[#EFF6FF] text-[#1D4ED8]" : "bg-[#F0FDF4] text-[#15803D]"}`}>
                  {type.toUpperCase()}
                </span>
                <span className="flex-1 min-w-0 text-sm text-[#334155] truncate">{name}</span>
                {/* Narrower bar on phones + count hidden below sm so the name never clips */}
                <div className="w-14 sm:w-32 h-2 bg-[#F2F1EE] rounded-full overflow-hidden flex-shrink-0">
                  <div className={`h-full rounded-full ${scoreBarColor(avg)}`} style={{ width: `${avg}%` }} />
                </div>
                <span className={`text-sm font-black tabular-nums w-10 text-right flex-shrink-0 ${scoreColor(avg)}`}>{avg}%</span>
                <span className="hidden sm:block text-xs text-[#CBD5E1] w-14 text-right flex-shrink-0">{count} attempts</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8] text-center py-6">No exam submissions yet — scores will appear here once students complete exams</p>
        )}
      </div>

      {/* Grade / class breakdown */}
      {gradeEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">Engagement by class</h2>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider pb-1 border-b border-[#F1F5F9]">
            <span>Class</span>
            <span className="w-20 text-center">Students</span>
            <span className="w-28 text-center">Lessons done</span>
            <span className="w-20 text-right">Avg / student</span>
          </div>
          {gradeEntries.map(([grade, { students, completions }]) => (
            <div key={grade} className="grid grid-cols-[1fr_auto_auto_auto] items-center">
              <span className="text-sm font-semibold text-[#334155]">{grade}</span>
              <span className="w-20 text-center text-sm font-black text-[#0f172a] tabular-nums">{students}</span>
              <span className="w-28 text-center text-sm font-black text-[#0f172a] tabular-nums">{completions}</span>
              <span className="w-20 text-right text-sm font-semibold text-[#475569] tabular-nums">
                {students > 0 ? (completions / students).toFixed(1) : "0"}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
