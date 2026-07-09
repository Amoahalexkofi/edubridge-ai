import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Users, BookOpen, Trophy, TrendingUp, Zap, GraduationCap, BarChart2, CheckCircle2 } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allRoles },
    { data: newRoles },
    { data: allProfiles },
    { data: allProgress },
    { data: recentProgress },
    { data: allAttempts },
    { data: subjects },
    { count: lessonCount },
    { count: questionCount },
  ] = await Promise.all([
    admin.from("user_roles").select("user_id, role, created_at"),
    admin.from("user_roles").select("user_id, role, created_at").gte("created_at", sevenDaysAgo),
    admin.from("profiles").select("id, full_name, exam_target, grade_level, school"),
    admin.from("lesson_progress").select("user_id").eq("completed", true),
    admin.from("lesson_progress").select("user_id").eq("completed", true).gte("last_viewed_at", sevenDaysAgo),
    admin.from("exam_attempts").select("user_id, subject_id, score, total_marks, submitted_at").eq("status", "submitted"),
    admin.from("subjects").select("id, name, exam_type"),
    admin.from("lessons").select("*", { count: "exact", head: true }),
    admin.from("questions").select("*", { count: "exact", head: true }),
  ]);

  // Role breakdown
  const totalUsers = allRoles?.length ?? 0;
  const students   = (allRoles ?? []).filter(r => r.role === "student");
  const teachers   = (allRoles ?? []).filter(r => r.role === "teacher");
  const parents    = (allRoles ?? []).filter(r => r.role === "parent");
  const newThisWeek = newRoles?.length ?? 0;
  const activeThisWeek = new Set((recentProgress ?? []).map(p => p.user_id)).size;

  // Exam stats
  const validAttempts = (allAttempts ?? []).filter(a => a.score != null && a.total_marks != null);
  const avgScore = validAttempts.length > 0
    ? Math.round(validAttempts.reduce((s, a) => s + (a.score! / a.total_marks!) * 100, 0) / validAttempts.length)
    : null;
  const passRate = validAttempts.length > 0
    ? Math.round(validAttempts.filter(a => (a.score! / a.total_marks!) >= 0.5).length / validAttempts.length * 100)
    : null;

  // BECE / WASSCE split
  const studentIds = new Set(students.map(s => s.user_id));
  const studentProfiles = (allProfiles ?? []).filter(p => studentIds.has(p.id));
  const beceCount   = studentProfiles.filter(p => p.exam_target === "bece").length;
  const wassceCount = studentProfiles.filter(p => p.exam_target === "wassce").length;
  const examTotal   = beceCount + wassceCount;

  // Grade breakdown
  const gradeMap: Record<string, number> = {};
  studentProfiles.forEach(p => {
    if (p.grade_level) gradeMap[p.grade_level] = (gradeMap[p.grade_level] ?? 0) + 1;
  });
  const gradeEntries = Object.entries(gradeMap).sort((a, b) => a[0].localeCompare(b[0]));
  const gradeMax = Math.max(...gradeEntries.map(([, v]) => v), 1);

  // Top 5 students by lessons completed
  const completionMap: Record<string, number> = {};
  (allProgress ?? []).forEach(p => { completionMap[p.user_id] = (completionMap[p.user_id] ?? 0) + 1; });
  const topStudents = Object.entries(completionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uid, count]) => ({
      profile: allProfiles?.find(p => p.id === uid),
      completions: count,
    }));
  const topMax = topStudents[0]?.completions ?? 1;

  // Subject performance — exam_attempts has subject_id directly
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
    .sort((a, b) => b.count - a.count);

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-1">Platform-wide performance and engagement data</p>
      </div>

      {/* Key stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total users",     value: totalUsers,              icon: Users,        color: "bg-blue-50 text-blue-600",   suffix: "" },
          { label: "New this week",   value: newThisWeek,             icon: TrendingUp,   color: "bg-green-50 text-green-600", suffix: "" },
          { label: "Active this week",value: activeThisWeek,          icon: Zap,          color: "bg-orange-50 text-[#E8722A]",suffix: "" },
          { label: "Avg exam score",  value: avgScore ?? "—",         icon: Trophy,       color: "bg-purple-50 text-purple-600",suffix: avgScore != null ? "%" : "" },
        ].map(({ label, value, icon: Icon, color, suffix }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-3xl font-black text-[#0f172a] tabular-nums leading-none">{value}{suffix}</p>
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Row: Role breakdown + Exam/Content summary */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Role breakdown */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">User breakdown</h2>
          </div>
          {[
            { label: "Students", count: students.length, color: "bg-[#1D4ED8]" },
            { label: "Teachers", count: teachers.length, color: "bg-[#E8722A]" },
            { label: "Parents",  count: parents.length,  color: "bg-green-500" },
          ].map(({ label, count, color }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#334155]">{label}</span>
                <span className="font-black text-[#0f172a] tabular-nums">{count}</span>
              </div>
              <div className="h-2 bg-[#F2F1EE] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: totalUsers > 0 ? `${(count / totalUsers) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Content + exam summary */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">Platform activity</h2>
          </div>
          {[
            { label: "Lessons in library",  value: lessonCount  ?? 0, icon: BookOpen,     color: "bg-blue-50 text-blue-600" },
            { label: "Questions in bank",   value: questionCount ?? 0, icon: BarChart2,    color: "bg-purple-50 text-purple-600" },
            { label: "Lessons completed",   value: allProgress?.length ?? 0, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
            { label: "Exams submitted",     value: allAttempts?.length ?? 0, icon: Trophy,       color: "bg-orange-50 text-[#E8722A]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm text-[#475569]">{label}</span>
              <span className="font-black text-[#0f172a] tabular-nums text-sm">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BECE vs WASSCE + Grade breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* BECE / WASSCE */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">BECE vs WASSCE</h2>
            <span className="ml-auto text-xs text-[#94a3b8]">{examTotal} students</span>
          </div>
          {[
            { label: "BECE (JHS)", count: beceCount, color: "bg-[#1D4ED8]", text: "text-[#1D4ED8]" },
            { label: "WASSCE (SHS)", count: wassceCount, color: "bg-[#15803D]", text: "text-[#15803D]" },
          ].map(({ label, count, color, text }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#334155]">{label}</span>
                <span className={`font-black tabular-nums ${text}`}>{count} <span className="text-[#94a3b8] font-normal text-xs">({examTotal > 0 ? Math.round((count / examTotal) * 100) : 0}%)</span></span>
              </div>
              <div className="h-2.5 bg-[#F2F1EE] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: examTotal > 0 ? `${(count / examTotal) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
          {examTotal === 0 && (
            <p className="text-xs text-[#94a3b8] text-center py-4">No student data yet</p>
          )}
        </div>

        {/* Grade level */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">Students by class</h2>
          </div>
          {gradeEntries.length > 0 ? gradeEntries.map(([grade, count]) => (
            <div key={grade} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#334155]">{grade}</span>
                <span className="font-black text-[#0f172a] tabular-nums">{count}</span>
              </div>
              <div className="h-2 bg-[#F2F1EE] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#1B3A8A]" style={{ width: `${(count / gradeMax) * 100}%` }} />
              </div>
            </div>
          )) : (
            <p className="text-xs text-[#94a3b8] text-center py-4">No grade data yet — students can update their profile</p>
          )}
        </div>
      </div>

      {/* Exam performance + Pass rate */}
      {(avgScore != null || passRate != null) && (
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#94a3b8]" />
            <h2 className="font-bold text-[#0f172a] text-sm">Exam performance</h2>
            <span className="ml-auto text-xs text-[#94a3b8]">{allAttempts?.length ?? 0} submissions</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F8F7F4] rounded-xl p-4 text-center">
              <p className={`text-4xl font-black tabular-nums ${avgScore != null ? scoreColor(avgScore) : "text-[#94a3b8]"}`}>
                {avgScore != null ? `${avgScore}%` : "—"}
              </p>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mt-1">Average score</p>
            </div>
            <div className="bg-[#F8F7F4] rounded-xl p-4 text-center">
              <p className={`text-4xl font-black tabular-nums ${passRate != null ? scoreColor(passRate) : "text-[#94a3b8]"}`}>
                {passRate != null ? `${passRate}%` : "—"}
              </p>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mt-1">Pass rate (≥50%)</p>
            </div>
          </div>
          {subjectPerf.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">By subject</p>
              {subjectPerf.map(({ name, type, avg, count }) => (
                <div key={name} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${type === "bece" ? "bg-[#EFF6FF] text-[#1D4ED8]" : "bg-[#F0FDF4] text-[#15803D]"}`}>
                    {type.toUpperCase()}
                  </span>
                  <span className="flex-1 text-sm text-[#334155] truncate">{name}</span>
                  <div className="w-24 h-1.5 bg-[#F2F1EE] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBarColor(avg)}`} style={{ width: `${avg}%` }} />
                  </div>
                  <span className={`text-sm font-black tabular-nums w-10 text-right ${scoreColor(avg)}`}>{avg}%</span>
                  <span className="text-xs text-[#CBD5E1] w-12 text-right">{count} tries</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top students */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#94a3b8]" />
          <h2 className="font-bold text-[#0f172a] text-sm">Top students by lessons completed</h2>
        </div>
        {topStudents.length > 0 ? (
          <div className="space-y-3">
            {topStudents.map(({ profile, completions }, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  idx === 0 ? "bg-yellow-400 text-yellow-900" :
                  idx === 1 ? "bg-slate-200 text-slate-600" :
                  idx === 2 ? "bg-orange-300 text-orange-900" : "bg-[#F2F1EE] text-[#64748B]"
                }`}>
                  {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
                </div>
                <div className="h-8 w-8 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials(profile?.full_name)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-[#0f172a] truncate">{profile?.full_name ?? "Unknown"}</p>
                  <div className="h-1.5 bg-[#F2F1EE] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${(completions / topMax) * 100}%` }} />
                  </div>
                </div>
                <span className="font-black text-[#0f172a] tabular-nums text-sm">{completions}</span>
                <span className="text-xs text-[#94a3b8]">lessons</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8] text-center py-6">No lesson completions yet</p>
        )}
      </div>

    </div>
  );
}
