import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { FileText, Trophy, Clock, ChevronRight, CheckCircle2, BarChart2, AlertCircle, Lock } from "lucide-react";
import { subjectGradient, subjectIcon } from "@/lib/subject-style";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const ERROR_MESSAGES: Record<string, string> = {
  no_questions: "This subject has no questions yet. Content is being added — check back soon!",
  insert_failed: "Could not start the exam. Please try again or contact support if the issue persists.",
};

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

  const { error: errorCode } = await searchParams;
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? "Something went wrong. Please try again.") : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_target")
    .eq("id", user.id)
    .single();

  const examTarget = profile?.exam_target ?? "BECE";
  const examLabel = examTarget.toUpperCase();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, color")
    .eq("exam_type", examTarget.toLowerCase())
    .order("name");

  // Build real question counts per subject
  const subjectIds = subjects?.map((s) => s.id) ?? [];
  const questionCountBySubject: Record<string, number> = {};

  if (subjectIds.length > 0) {
    const { data: topicsForSubjects } = await supabase
      .from("topics")
      .select("id, subject_id")
      .in("subject_id", subjectIds);

    if (topicsForSubjects && topicsForSubjects.length > 0) {
      const topicIds = topicsForSubjects.map((t) => t.id);
      const topicToSubject: Record<string, string> = {};
      topicsForSubjects.forEach((t) => { topicToSubject[t.id] = t.subject_id; });

      const { data: questionRows } = await supabase
        .from("questions")
        .select("topic_id")
        .in("topic_id", topicIds);

      questionRows?.forEach((q) => {
        const sid = topicToSubject[q.topic_id];
        if (sid) questionCountBySubject[sid] = (questionCountBySubject[sid] ?? 0) + 1;
      });
    }
  }

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, status, score, total_marks, started_at, submitted_at, subject_id, subjects(name, icon)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);

  const submitted = attempts?.filter((a) => a.status === "submitted") ?? [];
  const avgScore = submitted.length > 0 && submitted.some((a) => a.score != null)
    ? Math.round(submitted.filter(a => a.score != null).reduce((sum, a) => sum + Math.round((a.score! / a.total_marks!) * 100), 0) / submitted.filter(a => a.score != null).length)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Page header ── */}
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                {examLabel} · Mock Exams
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0f172a]">
              Test your knowledge
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              WAEC-style timed papers · instant marking · detailed results
            </p>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-[#0f172a] tabular-nums">{submitted.length}</p>
              <p className="text-[10px] sm:text-xs text-[#94a3b8]">Exams taken</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-[#0f172a] tabular-nums">{avgScore != null ? `${avgScore}%` : "—"}</p>
              <p className="text-[10px] sm:text-xs text-[#94a3b8]">Avg score</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-[#0f172a] tabular-nums">{subjects?.length ?? 0}</p>
              <p className="text-[10px] sm:text-xs text-[#94a3b8]">Subjects</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subject grid ── */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Choose a subject to start</p>

        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {subjects.map((s) => {
              const questionCount = questionCountBySubject[s.id] ?? 0;
              const hasContent = questionCount > 0;
              const examCount = Math.min(questionCount, 40);
              const SubjIcon = subjectIcon(s.name);

              if (!hasContent) {
                return (
                  <div
                    key={s.id}
                    className="bg-[#FAFAFA] rounded-2xl border border-[#E6E4DE] eb-card p-5 flex flex-col gap-4 opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${subjectGradient(s.color)} flex items-center justify-center shadow-sm`}>
                        <SubjIcon className="h-5 w-5 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F1F0EC] text-slate-400 flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Coming soon
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[15px] text-[#94a3b8] leading-snug">{s.name}</p>
                      <p className="text-xs text-[#CBD5E1] mt-1">No questions yet</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#CBD5E1]">Not available</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={s.id}
                  href={`/student/exams/take?subject=${s.id}`}
                  className="group bg-white rounded-2xl border border-[#E6E4DE] eb-card eb-lift p-5 flex flex-col gap-4 hover:border-violet-300"
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${subjectGradient(s.color)} flex items-center justify-center shadow-sm`}>
                      <SubjIcon className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                      Timed
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-[15px] text-[#0f172a] leading-snug group-hover:text-violet-700 transition-colors">
                      {s.name}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {examCount} questions · 40 min
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#94a3b8]">Start exam</span>
                    <ChevronRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-violet-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-12 text-center space-y-2">
            <FileText className="h-8 w-8 text-[#CBD5E1] mx-auto" />
            <p className="font-semibold text-[#334155] text-sm">No subjects available yet</p>
          </div>
        )}
      </div>

      {/* ── Past attempts ── */}
      {attempts && attempts.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Past attempts</p>
          {attempts.map((attempt) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sub = attempt.subjects as any;
            const pct = attempt.score != null && attempt.total_marks
              ? Math.round((attempt.score / attempt.total_marks) * 100)
              : null;
            const isSubmitted = attempt.status === "submitted";

            return (
              <Link
                key={attempt.id}
                href={`/student/exams/${attempt.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-[#E6E4DE] eb-card eb-lift p-4 hover:border-[#1D4ED8]/40"
              >
                <div className="h-11 w-11 rounded-xl bg-[#F8F7F4] border border-[#E6E4DE] flex items-center justify-center text-xl flex-shrink-0">
                  {sub?.icon ?? "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0f172a]">{sub?.name ?? "Unknown subject"}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{formatDate(attempt.started_at)}</p>
                </div>
                {isSubmitted && pct != null ? (
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-black tabular-nums ${
                      pct >= 60 ? "text-[#16A34A]" : pct >= 40 ? "text-[#D97706]" : "text-[#DC2626]"
                    }`}>{pct}%</p>
                    <p className="text-xs text-[#94a3b8]">{attempt.score}/{attempt.total_marks}</p>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100 flex-shrink-0">
                    {isSubmitted ? "Submitted" : "In progress"}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-[#CBD5E1] flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-10 text-center space-y-2">
          <Trophy className="h-8 w-8 text-[#CBD5E1] mx-auto" />
          <p className="font-semibold text-[#334155] text-sm">No exams taken yet</p>
          <p className="text-xs text-[#94a3b8]">Start an exam above to see your results here.</p>
        </div>
      )}
    </div>
  );
}
