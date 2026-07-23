import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, FileText, TrendingUp,
  ArrowRight, ChevronRight, Trophy, Flame,
  Zap, Star, Target, Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";
import { checkAndAwardBadges, BADGES } from "@/lib/badges";
import { subjectGradient, subjectIcon } from "@/lib/subject-style";
import { LESSON_XP, EXAM_XP, HIGH_SCORE_BONUS, LEVELS, getLevel } from "@/lib/xp";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const user = await getAuthUser();
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

  const [
    { data: subjects },
    { count: lessonsCompleted },
    { count: examsTaken },
    { data: examScores },
    { data: recentProgress },
    { data: leaderboardRows },
    recommendations,
    badgeState,
  ] = await Promise.all([
    supabase.from("subjects").select("id, name, slug, icon, color, description, topics(id)").eq("exam_type", examTarget.toLowerCase()).order("name"),
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
    supabase.from("exam_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "submitted"),
    supabase.from("exam_attempts").select("score, total_marks").eq("user_id", user.id).eq("status", "submitted").not("score", "is", null),
    supabase.from("lesson_progress").select("lesson_id, last_viewed_at, completed, lessons(title, topic_id, topics(title, subject_id, subjects(name, slug)))").eq("user_id", user.id).order("last_viewed_at", { ascending: false }).limit(1).single(),
    supabase.rpc("leaderboard", { p_exam_target: (profile?.exam_target ?? "bece").toLowerCase() }),
    getRecommendations(supabase, user.id, profile?.exam_target ?? "bece"),
    checkAndAwardBadges(supabase, user.id),
  ]);

  const earnedCount = Object.keys(badgeState.earned).length;
  const newBadges = BADGES.filter(b => badgeState.newlyEarned.includes(b.id));

  const avgScore = examScores && examScores.length > 0
    ? Math.round(examScores.reduce((sum, e) => sum + (e.score / e.total_marks) * 100, 0) / examScores.length)
    : null;

  // XP
  const bonusXP = (examScores ?? []).filter((e) => e.score / e.total_marks >= 0.8).length * HIGH_SCORE_BONUS;
  const totalXP = (lessonsCompleted ?? 0) * LESSON_XP + (examsTaken ?? 0) * EXAM_XP + bonusXP;
  const currentLevel = getLevel(totalXP);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const xpPct = nextLevel
    ? Math.min(100, Math.round(((totalXP - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100;

  // Streak — computed once inside checkAndAwardBadges from the same lesson_progress
  // data; reuse it instead of re-querying and re-deriving it here.
  const streak = badgeState.stats.streak;

  // Top 3 leaderboard teaser — already ranked by the leaderboard RPC.
  const top3 = ((leaderboardRows ?? []) as Array<{ id: string; full_name: string | null; lessons: number | string }>)
    .slice(0, 3)
    .map((s) => ({ id: s.id, full_name: s.full_name, lessons: Number(s.lessons) }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = recentProgress as any;

  const stats = [
    { label: "Subjects",     value: subjects?.length ?? 0,                        icon: BookOpen,   color: "from-blue-500 to-blue-600",     href: "/student/subjects" },
    { label: "Lessons done", value: lessonsCompleted ?? 0,                         icon: TrendingUp, color: "from-emerald-500 to-emerald-600", href: "/student/subjects" },
    { label: "Mock exams",   value: examsTaken ?? 0,                               icon: FileText,   color: "from-violet-500 to-violet-600", href: "/student/exams"    },
    { label: "Avg score",    value: avgScore != null ? `${avgScore}%` : "—",       icon: Trophy,     color: "from-amber-500 to-amber-600",   href: "/student/exams"    },
  ];


  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
            {greeting} <span>👋</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            streak > 0 ? "bg-[#E8722A]/10 border-[#E8722A]/20" : "bg-[#F8F7F4] border-[#E6E4DE]"
          }`}>
            <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "text-[#E8722A]" : "text-slate-300"}`} />
            <span className={`text-xs font-bold ${streak > 0 ? "text-[#E8722A]" : "text-slate-400"}`}>
              {streak} day{streak !== 1 ? "s" : ""} streak
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-[#1B3A8A] text-white text-xs font-bold tracking-wider uppercase shadow-sm">
            {examTarget}
          </span>
        </div>
      </div>

      {/* ── New badge celebration (shows once, on the load that awards it) ── */}
      {newBadges.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-6">
          <span className="text-2xl" aria-hidden>🏅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">
              {newBadges.length === 1 ? "New badge unlocked!" : `${newBadges.length} new badges unlocked!`}
            </p>
            <p className="text-xs text-amber-700 truncate">
              {newBadges.map(b => `${b.title} — ${b.desc.toLowerCase()}`).join(" · ")}
            </p>
          </div>
          <Link href="/student/profile#badges" className="text-xs font-bold text-amber-800 underline underline-offset-2 flex-shrink-0">
            View
          </Link>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E4DE] eb-card eb-lift flex flex-col gap-3 hover:border-[#1B3A8A]/40 group"
          >
            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[1.75rem] font-black text-slate-900 leading-none tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Continue learning / Get started ── */}
      {recent?.lessons ? (
        <Link
          href={`/student/lessons/${recent.lesson_id}`}
          className="flex items-center gap-4 bg-gradient-to-r from-[#1B3A8A] to-[#2d4fa0] text-white rounded-2xl p-5 hover:from-[#162f74] hover:to-[#1B3A8A] transition-all group mb-6 eb-card-navy eb-lift"
        >
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-200 font-semibold mb-0.5 uppercase tracking-wide">Continue learning</p>
            <p className="text-xs text-blue-200/70 mb-1">
              {recent.lessons?.topics?.subjects?.name} · {recent.lessons?.topics?.title}
            </p>
            <p className="font-bold text-white truncate text-lg">{recent.lessons?.title}</p>
          </div>
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/15 group-hover:bg-[#E8722A] flex items-center justify-center transition-colors">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </Link>
      ) : (
        <div className="bg-gradient-to-r from-[#1B3A8A] to-[#2d4fa0] rounded-2xl p-6 mb-6 eb-card-navy">
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

      {/* ── Recommended for you (adaptive) ── */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#E8722A]" />
            <h2 className="font-bold text-slate-900">Recommended for you</h2>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Based on your results</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec: Recommendation) => {
              const style = {
                weak_topic:  { icon: Target,   chip: "bg-amber-50 text-amber-600 border-amber-100",   label: rec.pct != null ? `${rec.pct}% — needs work` : "Needs work" },
                new_subject: { icon: BookOpen, chip: "bg-blue-50 text-blue-600 border-blue-100",      label: "New for you" },
                first_exam:  { icon: FileText, chip: "bg-purple-50 text-purple-600 border-purple-100", label: "First step" },
                retry_exam:  { icon: Trophy,   chip: "bg-green-50 text-green-600 border-green-100",   label: "Beat your score" },
              }[rec.kind];
              const Icon = style.icon;
              return (
                <Link
                  key={rec.title}
                  href={rec.href}
                  className="group bg-white rounded-2xl border border-[#E6E4DE] eb-card eb-lift p-4 hover:border-[#1B3A8A]/40 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${style.chip}`}>
                      <Icon className="h-3 w-3" /> {style.label}
                    </span>
                    {rec.subjectName && (
                      <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[40%]">{rec.subjectName}</span>
                    )}
                  </div>
                  <p className="font-bold text-sm text-slate-900 leading-snug">{rec.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{rec.detail}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3A8A] group-hover:gap-2 transition-all">
                    Start now <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
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
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[...subjects].sort((a, b) => (b.topics?.length ?? 0) - (a.topics?.length ?? 0)).map((subject) => {
                  const topicCount = subject.topics?.length ?? 0;
                  const SubjIcon = subjectIcon(subject.name);
                  return (
                    <Link
                      key={subject.id}
                      href={`/student/subjects/${subject.slug}`}
                      className="group bg-white rounded-xl border border-[#E6E4DE] eb-card eb-lift p-3 flex items-center gap-3 hover:border-[#1D4ED8]/40"
                    >
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${subjectGradient(subject.color)} flex items-center justify-center shadow-sm flex-shrink-0`}>
                        <SubjIcon className="h-4 w-4 text-white" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#0f172a] truncate group-hover:text-[#1D4ED8] transition-colors">{subject.name}</p>
                        <p className="text-xs text-slate-400">{topicCount} topic{topicCount === 1 ? "" : "s"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1D4ED8] transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] p-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#F8F7F4] flex items-center justify-center mx-auto mb-3">
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

          {/* Your progress — level, XP and badges in one calm card */}
          <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">Level {currentLevel.level}</p>
                  <p className="text-xs text-slate-400 leading-tight">{currentLevel.label}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">{totalXP.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-[#F1F0EC] rounded-full mb-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8] rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-xs text-slate-400">
              {nextLevel
                ? `${(nextLevel.min - totalXP).toLocaleString()} XP to ${nextLevel.label}`
                : "Max level reached — Champion!"}
            </p>

            {/* Badges */}
            <div className="mt-4 pt-3.5 border-t border-[#EEEDE8]">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Badges</p>
                <span className="text-xs font-bold text-slate-400 tabular-nums">{earnedCount}/{BADGES.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BADGES.slice(0, 7).map(b => {
                  const isEarned = !!badgeState.earned[b.id];
                  const Icon = b.icon;
                  return (
                    <span
                      key={b.id}
                      title={`${b.title} — ${b.desc}`}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center ${
                        isEarned ? b.tint : "bg-[#F8F7F4] text-slate-300 border-[#EEEDE8]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  );
                })}
                <Link
                  href="/student/profile#badges"
                  title="View all badges"
                  className="h-8 w-8 rounded-lg border border-[#EEEDE8] bg-[#F8F7F4] flex items-center justify-center text-slate-400 hover:text-[#1B3A8A] hover:border-[#1B3A8A]/30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Leaderboard teaser */}
          <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Leaderboard</h3>
            </div>
            {top3.length > 0 ? (
              <div className="space-y-2.5">
                {top3.map((s, i) => {
                  const isMe = s.id === user.id;
                  return (
                    <div key={s.id} className="flex items-center gap-2.5">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : "bg-orange-300 text-orange-900"
                      }`}>
                        {medals[i]}
                      </div>
                      <span className={`flex-1 min-w-0 text-sm truncate ${isMe ? "font-bold text-[#1B3A8A]" : "font-medium text-slate-700"}`}>
                        {s.full_name?.split(" ")[0] ?? "Student"}{isMe ? " (you)" : ""}
                      </span>
                      <span className="text-xs font-bold text-[#E8722A] tabular-nums flex-shrink-0">{s.lessons} lessons</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No rankings yet — complete a lesson to appear here!</p>
            )}
            <Link href="/student/leaderboard" className="mt-3 text-xs text-[#1B3A8A] font-semibold hover:underline flex items-center gap-0.5">
              View full leaderboard <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
