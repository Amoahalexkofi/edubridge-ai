import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Trophy, CheckCircle2, XCircle, ArrowLeft,
  RotateCcw, BookOpen, Clock,
} from "lucide-react";

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(`
      id, status, score, total_marks, answers, started_at, submitted_at, exam_type,
      subject_id,
      subjects(id, name, icon, slug)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!attempt) notFound();

  if (attempt.status !== "submitted") {
    redirect(`/student/exams/take?subject=${attempt.subject_id}&resume=${id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subject = attempt.subjects as any;
  const pct = attempt.score != null && attempt.total_marks
    ? Math.round((attempt.score / attempt.total_marks) * 100)
    : 0;

  const grade = pct >= 80 ? { label: "Excellent", color: "text-green-600", bg: "bg-green-50 border-green-200" }
    : pct >= 60 ? { label: "Good", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" }
    : pct >= 40 ? { label: "Fair", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" }
    : { label: "Needs work", color: "text-red-600", bg: "bg-red-50 border-red-200" };

  // Fetch questions to show review
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", attempt.subject_id);

  const topicIds = topics?.map((t) => t.id) ?? [];
  const answers = (attempt.answers ?? {}) as Record<string, string>;
  const questionIds = Object.keys(answers);

  const { data: questions } = questionIds.length > 0
    ? await supabase
        .from("questions")
        .select("id, body, options, correct_option, explanation, topics(name)")
        .in("id", questionIds)
    : { data: [] };

  // Per-topic breakdown
  const topicStats: Record<string, { name: string; correct: number; total: number }> = {};
  questions?.forEach((q) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicName = (q.topics as any)?.name ?? "Other";
    if (!topicStats[topicName]) topicStats[topicName] = { name: topicName, correct: 0, total: 0 };
    topicStats[topicName].total++;
    if (answers[q.id] === q.correct_option) topicStats[topicName].correct++;
  });

  const duration = attempt.submitted_at
    ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Back */}
      <Link
        href="/student/exams"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All exams
      </Link>

      {/* Score card */}
      <div className={`rounded-2xl border p-6 sm:p-8 text-center ${grade.bg}`}>
        <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Trophy className={`h-8 w-8 ${grade.color}`} />
        </div>
        <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${grade.color}`}>{grade.label}</p>
        <h1 className="text-5xl font-black text-[#0f172a] tabular-nums mb-1">{pct}%</h1>
        <p className="text-sm text-[#64748B] mb-2">
          {attempt.score} of {attempt.total_marks} correct
        </p>
        <p className="text-xs text-[#94a3b8]">
          {subject?.icon} {subject?.name} · {formatDate(attempt.started_at)}
          {duration && <> · <Clock className="h-3 w-3 inline mx-0.5" />{duration} min</>}
        </p>
      </div>

      {/* Topic breakdown */}
      {Object.values(topicStats).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <h2 className="font-bold text-[#0f172a] mb-4">Performance by topic</h2>
          <div className="space-y-3">
            {Object.values(topicStats).map((t) => {
              const topicPct = Math.round((t.correct / t.total) * 100);
              return (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#334155]">{t.name}</p>
                    <p className="text-xs font-bold text-[#64748B] tabular-nums">{t.correct}/{t.total}</p>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        topicPct >= 60 ? "bg-green-500" : topicPct >= 40 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${topicPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed review */}
      {questions && questions.length > 0 && (
        <div>
          <h2 className="font-bold text-[#0f172a] mb-3">Full review</h2>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const selected = answers[q.id];
              const isCorrect = selected === q.correct_option;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-4 ${isCorrect ? "border-[#E2E8F0]" : "border-red-100"}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm font-medium text-[#0f172a] leading-snug">
                      <span className="text-[#94a3b8] mr-1">{i + 1}.</span>
                      {q.body}
                    </p>
                  </div>
                  <div className="pl-7 space-y-1.5 text-xs">
                    {(q.options as Array<{ id: string; text: string }>).map((opt) => {
                      const isCorrectOpt = opt.id === q.correct_option;
                      const isSelectedOpt = opt.id === selected;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            isCorrectOpt ? "bg-green-50 text-green-700"
                            : isSelectedOpt && !isCorrectOpt ? "bg-red-50 text-red-700"
                            : "text-[#94a3b8]"
                          }`}
                        >
                          <span className="font-bold uppercase">{opt.id}.</span>
                          <span>{opt.text}</span>
                          {isCorrectOpt && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                          {isSelectedOpt && !isCorrectOpt && <XCircle className="h-3 w-3 ml-auto" />}
                        </div>
                      );
                    })}
                    {!isCorrect && q.explanation && (
                      <p className="mt-2 text-[#64748B] italic leading-relaxed pt-1 border-t border-[#F1F5F9]">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/student/exams/take?subject=${attempt.subject_id}`}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </Link>
        <Link
          href="/student/subjects"
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors"
        >
          <BookOpen className="h-4 w-4" /> Study more
        </Link>
      </div>
    </div>
  );
}
