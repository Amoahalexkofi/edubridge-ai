import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, PenLine, FileText, TrendingUp,
  ArrowRight, ChevronRight, Trophy, Flame,
  Brain, Zap, Star, Target, Sparkles, CalendarCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";
import { checkAndAwardBadges, BADGES } from "@/lib/badges";

const LESSON_XP = 10;
const EXAM_XP = 20;
const HIGH_SCORE_BONUS = 10;

const LEVELS = [
  { level: 1, label: "Beginner",  min: 0    },
  { level: 2, label: "Explorer",  min: 500  },
  { level: 3, label: "Achiever",  min: 1000 },
  { level: 4, label: "Scholar",   min: 2000 },
  { level: 5, label: "Champion",  min: 4000 },
];

function getLevel(xp: number) {
  return [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const uniqueDays = [...new Set(dates.map((d) => d.split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = Math.round(
      (new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

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
    { data: streakData },
    { data: studentRoles },
    recommendations,
    badgeState,
  ] = await Promise.all([
    supabase.from("subjects").select("id, name, slug, icon, color, description, topics(id)").eq("exam_type", examTarget.toLowerCase()).order("name"),
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
    supabase.from("exam_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "submitted"),
    supabase.from("exam_attempts").select("score, total_marks").eq("user_id", user.id).eq("status", "submitted").not("score", "is", null),
    supabase.from("lesson_progress").select("lesson_id, last_viewed_at, completed, lessons(title, topic_id, topics(title, subject_id, subjects(name, slug)))").eq("user_id", user.id).order("last_viewed_at", { ascending: false }).limit(1).single(),
    supabase.from("lesson_progress").select("last_viewed_at").eq("user_id", user.id).eq("completed", true).order("last_viewed_at", { ascending: false }).limit(365),
    supabase.from("user_roles").select("user_id").eq("role", "student"),
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

  // Streak
  const streak = calculateStreak((streakData ?? []).map((d) => d.last_viewed_at));

  // Top 3 leaderboard teaser
  const studentIds = studentRoles?.map((r) => r.user_id) ?? [];
  const { data: peerProfiles } = studentIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds).eq("exam_target", examTarget)
    : { data: [] };
  const { data: peerProgress } = studentIds.length > 0
    ? await supabase.from("lesson_progress").select("user_id").eq("completed", true).in("user_id", studentIds)
    : { data: [] };

  const peerCounts: Record<string, number> = {};
  peerProgress?.forEach((p) => { peerCounts[p.user_id] = (peerCounts[p.user_id] ?? 0) + 1; });
  const top3 = (peerProfiles ?? [])
    .map((p) => ({ ...p, lessons: peerCounts[p.id] ?? 0 }))
    .sort((a, b) => b.lessons - a.lessons)
    .slice(0, 3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = recentProgress as any;

  const stats = [
    { label: "Subjects",     value: subjects?.length ?? 0,                        icon: BookOpen,   color: "bg-blue-50 text-blue-600",     href: "/student/subjects" },
    { label: "Lessons done", value: lessonsCompleted ?? 0,                         icon: TrendingUp, color: "bg-green-50 text-green-600",   href: "/student/subjects" },
    { label: "Mock exams",   value: examsTaken ?? 0,                               icon: FileText,   color: "bg-purple-50 text-purple-600", href: "/student/exams"    },
    { label: "Avg score",    value: avgScore != null ? `${avgScore}%` : "—",       icon: Trophy,     color: "bg-amber-50 text-amber-600",   href: "/student/exams"    },
  ];

  const quickActions = [
    { href: "/student/subjects", label: "Browse subjects", desc: "Explore all topics",           icon: BookOpen,      bg: "bg-[#1B3A8A]"   },
    { href: "/student/practice", label: "Quick practice",  desc: "Sharpen your skills",          icon: PenLine,       bg: "bg-[#E8722A]"   },
    { href: "/student/exams",    label: "Start mock exam", desc: "WAEC-style timed paper",       icon: FileText,      bg: "bg-purple-600"  },
    { href: "/student/planner",  label: "Study plan",      desc: "Your week-by-week roadmap",    icon: CalendarCheck, bg: "bg-[#1D4ED8]"   },
    { href: "/student/ai-tutor", label: "Ask AI Tutor",   desc: "Get instant help",              icon: Brain,         bg: "bg-teal-600"    },
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
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E4DE] flex flex-col gap-3 hover:border-[#1B3A8A]/30 hover:shadow-sm transition-all group"
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
                  className="group bg-white rounded-2xl border border-[#E6E4DE] p-4 hover:border-[#1B3A8A]/30 hover:shadow-sm transition-all flex flex-col gap-2.5"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...subjects].sort((a, b) => (b.topics?.length ?? 0) - (a.topics?.length ?? 0)).map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/student/subjects/${subject.slug}`}
                    className="group bg-white rounded-2xl border border-[#E6E4DE] p-4 hover:border-[#1D4ED8]/30 hover:shadow-md transition-all flex flex-col gap-3"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#F8F7F4] border border-[#E6E4DE] flex items-center justify-center text-lg">
                      {subject.icon ?? "📚"}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#0f172a] leading-snug group-hover:text-[#1D4ED8] transition-colors">{subject.name}</p>
                      {subject.description && (
                        <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-2">{subject.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#1D4ED8] text-xs font-semibold">
                      Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
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

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-4">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Quick actions</h3>
            <div className="space-y-2">
              {quickActions.map(({ href, label, desc, icon: Icon, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8F7F4] transition-colors group"
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
                <span className="text-sm font-bold">Level {currentLevel.level} · {currentLevel.label}</span>
              </div>
              <span className="text-xs text-white/50 tabular-nums">
                {totalXP.toLocaleString()}{nextLevel ? ` / ${nextLevel.min.toLocaleString()}` : ""} XP
              </span>
            </div>
            <div className="h-2 bg-white/15 rounded-full mb-3">
              <div className="h-full bg-[#E8722A] rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-xs text-white/50">
              {nextLevel
                ? `${(nextLevel.min - totalXP).toLocaleString()} XP to Level ${nextLevel.level} · ${nextLevel.label}`
                : "Max level reached — Champion!"}
            </p>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Badges</h3>
              <span className="text-xs font-bold text-slate-400 tabular-nums">{earnedCount}/{BADGES.length}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {BADGES.slice(0, 8).map(b => {
                const isEarned = !!badgeState.earned[b.id];
                const Icon = b.icon;
                return (
                  <span
                    key={b.id}
                    title={`${b.title} — ${b.desc}`}
                    className={`h-9 w-9 rounded-xl border flex items-center justify-center ${
                      isEarned ? b.tint : "bg-[#F8F7F4] text-slate-300 border-[#EEEDE8]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                );
              })}
            </div>
            <Link href="/student/profile#badges" className="text-xs font-bold text-[#1B3A8A] hover:underline underline-offset-2">
              View all badges →
            </Link>
          </div>

          {/* Leaderboard teaser */}
          <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-4">
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
