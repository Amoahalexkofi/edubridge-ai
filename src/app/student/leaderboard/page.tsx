import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Medal, Flame, BookOpen, GraduationCap } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, avatar_url")
    .eq("id", user.id)
    .single();

  const examTarget = (profile?.exam_target ?? "bece").toLowerCase();

  // Fetch all students with same exam type
  const { data: studentRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "student");

  const studentIds = studentRoles?.map((r) => r.user_id) ?? [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, exam_target, avatar_url")
    .in("id", studentIds.length > 0 ? studentIds : ["none"])
    .eq("exam_target", examTarget);

  // Count completed lessons per student
  const { data: allProgress } = await supabase
    .from("lesson_progress")
    .select("user_id")
    .eq("completed", true)
    .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

  const lessonCounts: Record<string, number> = {};
  allProgress?.forEach((p) => {
    lessonCounts[p.user_id] = (lessonCounts[p.user_id] ?? 0) + 1;
  });

  // Count exam attempts per student
  const { data: allAttempts } = await supabase
    .from("exam_attempts")
    .select("user_id, score")
    .eq("status", "submitted")
    .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

  const examCounts: Record<string, number> = {};
  const examScores: Record<string, number[]> = {};
  allAttempts?.forEach((a) => {
    examCounts[a.user_id] = (examCounts[a.user_id] ?? 0) + 1;
    if (a.score != null) {
      examScores[a.user_id] = [...(examScores[a.user_id] ?? []), a.score];
    }
  });

  // Rank students by lessons completed, then exam count as tiebreaker
  const ranked = (profiles ?? [])
    .map((p) => {
      const lessons = lessonCounts[p.id] ?? 0;
      const exams = examCounts[p.id] ?? 0;
      const scores = examScores[p.id] ?? [];
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      return { ...p, lessons, exams, avgScore };
    })
    .sort((a, b) => b.lessons - a.lessons || b.exams - a.exams);

  const myRank = ranked.findIndex((r) => r.id === user.id) + 1;
  const myStats = ranked.find((r) => r.id === user.id);

  const medalColors = [
    "bg-yellow-400 text-yellow-900",
    "bg-slate-300 text-slate-700",
    "bg-orange-400 text-orange-900",
  ];

  const medalIcons = ["🥇", "🥈", "🥉"];

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Leaderboard</h1>
        </div>
        <p className="text-sm text-[#64748B]">
          Top {examTarget.toUpperCase()} students ranked by lessons completed
        </p>
      </div>

      {/* My rank card */}
      {myStats && (
        <div className="bg-[#1B3A8A] rounded-2xl p-4 flex items-center gap-4 text-white">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {myRank > 0 ? `#${myRank}` : "—"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Your ranking</p>
            <p className="text-white/70 text-xs mt-0.5">
              {myStats.lessons} lessons completed
              {myStats.exams > 0 ? ` · ${myStats.exams} exams taken` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl">
            <Flame className="h-4 w-4 text-orange-300" />
            <span className="text-sm font-bold">{examTarget.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {ranked.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="font-bold text-[#334155]">No rankings yet</p>
          <p className="text-sm text-[#94a3b8] mt-1 max-w-xs mx-auto">
            Be the first! Complete lessons to appear on the leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((student, idx) => {
            const isMe = student.id === user.id;
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  isMe
                    ? "bg-[#EFF6FF] border-[#1D4ED8]/30 shadow-sm"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                {/* Rank */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  isTop3 ? medalColors[rank - 1] : "bg-[#F1F5F9] text-[#64748B]"
                }`}>
                  {isTop3 ? medalIcons[rank - 1] : rank}
                </div>

                {/* Avatar */}
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isMe ? "bg-[#1B3A8A] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                }`}>
                  {student.full_name ? initials(student.full_name) : "?"}
                </div>

                {/* Name & stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm truncate ${isMe ? "text-[#1B3A8A]" : "text-[#0f172a]"}`}>
                      {student.full_name ?? "Student"}
                      {isMe && <span className="text-[10px] font-semibold text-[#1D4ED8] ml-1">(you)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
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
                      <span className="text-xs font-semibold text-[#22C55E]">
                        avg {student.avgScore}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-20 flex-shrink-0">
                  {ranked[0].lessons > 0 && (
                    <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isMe ? "bg-[#1D4ED8]" : "bg-[#94a3b8]"}`}
                        style={{ width: `${(student.lessons / ranked[0].lessons) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-right text-[#94a3b8] mt-0.5">{student.lessons} pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam type note */}
      <div className="flex items-center gap-2 text-xs text-[#94a3b8] justify-center">
        <GraduationCap className="h-3.5 w-3.5" />
        <span>Showing {examTarget.toUpperCase()} students only · Rankings update in real time</span>
      </div>
    </div>
  );
}
