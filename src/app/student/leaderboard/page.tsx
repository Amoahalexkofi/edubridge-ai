import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Trophy, BookOpen, Medal, Flame, Star, GraduationCap } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, avatar_url")
    .eq("id", user.id)
    .single();

  const examTarget = (profile?.exam_target ?? "bece").toLowerCase();
  const examLabel = examTarget.toUpperCase();

  // Ranking is aggregated in the database (one GROUP BY query) rather than pulling
  // every student's full lesson/exam history to the server and counting in JS.
  const { data: rows } = await supabase.rpc("leaderboard", { p_exam_target: examTarget });
  const ranked = ((rows ?? []) as Array<{
    id: string; full_name: string | null; lessons: number | string; exams: number | string; avg_score: number | string | null; xp: number | string;
  }>).map((r) => ({
    id: r.id,
    full_name: r.full_name,
    lessons: Number(r.lessons),
    exams: Number(r.exams),
    avgScore: r.avg_score != null ? Number(r.avg_score) : null,
    xp: Number(r.xp),
  }));

  const myRank = ranked.findIndex((r) => r.id === user.id) + 1;
  const myStats = ranked.find((r) => r.id === user.id);
  const topScore = ranked[0]?.xp ?? 0;

  function initials(name: string) {
    return (name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  const podium = ranked.slice(0, 3);

  const podiumConfig = [
    { order: 1, height: "h-24", medal: "🥇", ring: "ring-yellow-400", bg: "from-yellow-400 to-amber-500", label: "1st", shadow: "shadow-yellow-200" },
    { order: 0, height: "h-16", medal: "🥈", ring: "ring-slate-300",  bg: "from-slate-300 to-slate-400",  label: "2nd", shadow: "shadow-slate-200" },
    { order: 2, height: "h-12", medal: "🥉", ring: "ring-orange-400", bg: "from-orange-400 to-amber-400", label: "3rd", shadow: "shadow-orange-200" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B3A8A] via-[#1D4ED8] to-[#7C3AED] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-white/5 translate-y-1/2" />

        <div className="relative grid sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-yellow-400 text-yellow-900">
                <Trophy className="h-3 w-3" /> Rankings
              </span>
              <span className="text-xs text-white/50 font-medium">{examLabel} students</span>
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-white leading-tight">
                Who&apos;s on<br />
                <span className="text-yellow-300">top today?</span>
              </h1>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">
                Compete with other {examLabel} students. Complete lessons and exams to climb the rankings.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{ranked.length}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Students</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">#{myRank || "—"}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Your Rank</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{myStats?.lessons ?? 0}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Your Lessons</p>
              </div>
            </div>
          </div>

          {/* Trophy visual */}
          <div className="hidden sm:flex items-center justify-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-yellow-400/30 flex items-center justify-center">
                  <Trophy className="h-14 w-14 text-yellow-300" />
                </div>
              </div>
              {/* Floating stars */}
              <Star className="absolute -top-2 -right-2 h-5 w-5 text-yellow-300 fill-yellow-300" />
              <Star className="absolute -bottom-1 -left-3 h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Star className="absolute top-4 -left-5 h-3 w-3 text-yellow-200 fill-yellow-200" />
            </div>
          </div>
        </div>
      </div>

      {ranked.length === 0 ? (
        /* ── Empty state ────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-dashed border-[#E6E4DE] py-20 text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-yellow-50 flex items-center justify-center mx-auto">
            <Trophy className="h-10 w-10 text-yellow-400" />
          </div>
          <div>
            <p className="font-black text-xl text-[#0f172a]">No rankings yet</p>
            <p className="text-sm text-[#94a3b8] mt-1 max-w-xs mx-auto leading-relaxed">
              Be the first {examLabel} student to complete a lesson and claim the #1 spot!
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-4 py-2 rounded-full">
            <Flame className="h-3.5 w-3.5 text-[#E8722A]" />
            Complete a lesson to appear here
          </div>
        </div>
      ) : (
        <>
          {/* ── Podium (top 3) ──────────────────────────────── */}
          {podium.length >= 1 && (
            <div>
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-6">Top performers</p>
              <div className="flex items-end justify-center gap-4">
                {/* Render in visual order: 2nd, 1st, 3rd */}
                {[1, 0, 2].map((podiumIdx) => {
                  const student = podium[podiumIdx];
                  if (!student) return <div key={podiumIdx} className="w-28" />;
                  const cfg = podiumConfig[podiumIdx];
                  const isMe = student.id === user.id;
                  return (
                    <div key={student.id} className="flex flex-col items-center gap-2 w-28 sm:w-36">
                      {/* Name + avatar */}
                      <div className="text-center space-y-1.5">
                        <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full mx-auto flex items-center justify-center text-lg font-black ring-4 shadow-lg ${cfg.ring} ${cfg.shadow} ${
                          isMe ? "bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] text-white" : `bg-gradient-to-br ${cfg.bg} text-white`
                        }`}>
                          {initials(student.full_name ?? "?")}
                        </div>
                        <p className="text-xs font-bold text-[#0f172a] truncate max-w-full px-1">
                          {student.full_name?.split(" ")[0] ?? "Student"}
                          {isMe && " (you)"}
                        </p>
                      </div>

                      {/* Podium block */}
                      <div className={`w-full ${cfg.height} bg-gradient-to-b ${cfg.bg} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 shadow-sm`}>
                        <span className="text-xl">{cfg.medal}</span>
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">{cfg.label}</span>
                      </div>

                      {/* Stats below podium */}
                      <div className="text-center">
                        <p className="text-sm font-black text-[#0f172a]">{student.lessons}</p>
                        <p className="text-[10px] text-[#94a3b8]">lessons</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Full ranked list ────────────────────────────── */}
          {ranked.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Full rankings</p>
              {ranked.map((student, idx) => {
                const rank = idx + 1;
                const isMe = student.id === user.id;
                const pct = topScore > 0 ? Math.round((student.xp / topScore) * 100) : 0;
                const isTop3 = rank <= 3;
                const medals = ["🥇", "🥈", "🥉"];

                return (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isMe
                        ? "bg-[#EFF6FF] border-[#1D4ED8]/40 shadow-sm"
                        : "bg-white border-[#E6E4DE] hover:border-[#CBD5E1]"
                    }`}
                  >
                    {/* Rank badge */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      rank === 1 ? "bg-yellow-400 text-yellow-900" :
                      rank === 2 ? "bg-slate-200 text-slate-600" :
                      rank === 3 ? "bg-orange-300 text-orange-900" :
                      isMe      ? "bg-[#1D4ED8] text-white" :
                                  "bg-[#F2F1EE] text-[#64748B]"
                    }`}>
                      {isTop3 ? medals[rank - 1] : `#${rank}`}
                    </div>

                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      isMe ? "bg-[#1B3A8A] text-white" : "bg-[#F2F1EE] text-[#64748B]"
                    }`}>
                      {initials(student.full_name ?? "?")}
                    </div>

                    {/* Name & stats */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold text-sm truncate ${isMe ? "text-[#1B3A8A]" : "text-[#0f172a]"}`}>
                          {student.full_name ?? "Student"}
                          {isMe && <span className="text-[10px] font-semibold text-[#1D4ED8] ml-1 normal-case">(you)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                          <BookOpen className="h-3 w-3" />
                          {student.lessons} {student.lessons === 1 ? "lesson" : "lessons"}
                        </span>
                        {student.exams > 0 && (
                          <span className="flex items-center gap-1 text-xs text-[#64748B]">
                            <Medal className="h-3 w-3" />
                            {student.exams} {student.exams === 1 ? "exam" : "exams"}
                          </span>
                        )}
                        {student.avgScore != null && (
                          <span className="text-xs font-bold text-[#22C55E]">avg {student.avgScore}%</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-[#F2F1EE] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rank === 1 ? "bg-yellow-400" :
                            rank === 2 ? "bg-slate-300" :
                            rank === 3 ? "bg-orange-400" :
                            isMe      ? "bg-[#1D4ED8]" : "bg-[#CBD5E1]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-black tabular-nums ${isMe ? "text-[#1D4ED8]" : "text-[#0f172a]"}`}>
                        {student.xp}
                      </p>
                      <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Footer note ─────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#94a3b8]">
        <GraduationCap className="h-3.5 w-3.5" />
        <span>{examLabel} students only · Points = XP (same as your dashboard) · Updates in real time</span>
      </div>

    </div>
  );
}
