import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  Trophy, CheckCircle2, XCircle, ArrowLeft,
  RotateCcw, BookOpen, Clock, Brain, Target,
  AlertTriangle, ChevronRight, Minus,
} from "lucide-react";

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const CIRCUMFERENCE = 2 * Math.PI * 40; // ~251.33

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

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
    redirect(`/student/exams/take?subject=${attempt.subject_id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subject = attempt.subjects as any;

  const answers = (attempt.answers ?? {}) as Record<string, string>;
  const questionIds = Object.keys(answers);

  // Service role required to read correct_answer (revoked from authenticated users)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: questions } = questionIds.length > 0
    ? await admin
        .from("questions")
        .select("id, prompt, options, correct_answer, explanation, topics(title)")
        .in("id", questionIds)
    : { data: [] };

  // Per-topic breakdown
  const topicStats: Record<string, { name: string; correct: number; total: number }> = {};
  questions?.forEach((q) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicName = (q.topics as any)?.title ?? "Other";
    if (!topicStats[topicName]) topicStats[topicName] = { name: topicName, correct: 0, total: 0 };
    topicStats[topicName].total++;
    if (answers[q.id] === q.correct_answer) topicStats[topicName].correct++;
  });

  const totalCorrect = Object.values(topicStats).reduce((s, t) => s + t.correct, 0);
  const totalQuestions = Object.values(topicStats).reduce((s, t) => s + t.total, 0) || attempt.total_marks || 1;
  const totalWrong = totalQuestions - totalCorrect;
  const pct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const grade = pct >= 80
    ? { label: "Excellent", ringColor: "#16A34A", bg: "bg-green-50 border-green-200", text: "text-green-700", badgeBg: "bg-green-100" }
    : pct >= 60
    ? { label: "Good", ringColor: "#1D4ED8", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", badgeBg: "bg-blue-100" }
    : pct >= 40
    ? { label: "Fair", ringColor: "#D97706", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", badgeBg: "bg-amber-100" }
    : { label: "Needs work", ringColor: "#DC2626", bg: "bg-red-50 border-red-200", text: "text-red-700", badgeBg: "bg-red-100" };

  const duration = attempt.submitted_at
    ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
    : null;

  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  // Sort topics: weakest first
  const sortedTopics = Object.values(topicStats).sort((a, b) => {
    const pa = a.total > 0 ? a.correct / a.total : 0;
    const pb = b.total > 0 ? b.correct / b.total : 0;
    return pa - pb;
  });

  const weakTopics = sortedTopics.filter((t) => t.total > 0 && Math.round((t.correct / t.total) * 100) < 60);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Back */}
      <Link
        href="/student/exams"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All exams
      </Link>

      {/* ── Score hero ── */}
      <div className={`rounded-2xl border p-6 sm:p-8 ${grade.bg}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">

          {/* SVG ring */}
          <div className="relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={grade.ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className="h-5 w-5 mb-0.5" style={{ color: grade.ringColor }} />
              <span className="text-3xl font-black text-[#0f172a] tabular-nums leading-none">{pct}%</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 ${grade.badgeBg} ${grade.text}`}>
              {grade.label}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] leading-tight mb-1">
              {subject?.icon} {subject?.name}
            </h1>
            <p className="text-sm text-[#64748B] flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              {formatDate(attempt.started_at)}
              {duration && (
                <>
                  <span className="text-[#CBD5E1]">·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {duration} min</span>
                </>
              )}
            </p>

            {/* Stats bar */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-[#16A34A] tabular-nums">{totalCorrect}</p>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3 text-[#16A34A]" /> Correct
                </p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-[#DC2626] tabular-nums">{totalWrong}</p>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5 flex items-center justify-center gap-0.5">
                  <XCircle className="h-3 w-3 text-[#DC2626]" /> Wrong
                </p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-[#94a3b8] tabular-nums">{totalQuestions}</p>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5 flex items-center justify-center gap-0.5">
                  <Minus className="h-3 w-3 text-[#94a3b8]" /> Total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Weak areas → AI Tutor CTA ── */}
      {weakTopics.length > 0 && (() => {
        const aiUrl = `/student/ai-tutor?from=exam&subject=${encodeURIComponent(subject?.name ?? "")}&score=${pct}&correct=${totalCorrect}&total=${totalQuestions}&weak=${encodeURIComponent(weakTopics.map(t => t.name).join(","))}`;
        return (
          <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#1B3A8A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1B3A8A] text-sm mb-0.5">Study your weak areas with AI Tutor</p>
                <p className="text-xs text-[#3730A3] mb-3">
                  You scored below 60% in {weakTopics.length} topic{weakTopics.length > 1 ? "s" : ""}. Your AI Tutor will start teaching these right away.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {weakTopics.map((t) => (
                    <span
                      key={t.name}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-[#1B3A8A] border border-[#C7D2FE] flex items-center gap-1.5"
                    >
                      <AlertTriangle className="h-3 w-3 text-[#D97706]" />
                      {t.name}
                      <span className="text-[#DC2626] font-bold tabular-nums">{Math.round((t.correct / t.total) * 100)}%</span>
                    </span>
                  ))}
                </div>
                <Link
                  href={aiUrl}
                  className="inline-flex items-center gap-2 bg-[#1B3A8A] hover:bg-[#162f74] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <Brain className="h-3.5 w-3.5" /> Ask AI Tutor to explain these
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Topic breakdown ── */}
      {sortedTopics.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-[#64748B]" />
            <h2 className="font-bold text-[#0f172a]">Performance by topic</h2>
            <span className="text-[10px] text-[#94a3b8] ml-1">weakest first</span>
          </div>
          <div className="space-y-3">
            {sortedTopics.map((t) => {
              const topicPct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
              const isWeak = topicPct < 60;
              return (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isWeak && <AlertTriangle className="h-3.5 w-3.5 text-[#D97706] flex-shrink-0" />}
                      <p className="text-sm font-medium text-[#334155]">{t.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#94a3b8] tabular-nums">{t.correct}/{t.total}</p>
                      <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md min-w-[36px] text-center ${
                        topicPct >= 60 ? "bg-green-50 text-green-700" : topicPct >= 40 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      }`}>{topicPct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#F2F1EE] rounded-full overflow-hidden">
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

      {/* ── Detailed review ── */}
      {questions && questions.length > 0 && (
        <div>
          <h2 className="font-bold text-[#0f172a] mb-3">Full review</h2>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const selected = answers[q.id];
              const isCorrect = selected === q.correct_answer;
              const opts = q.options as Array<{ id: string; text: string }>;
              const correctOpt = opts.find((o) => o.id === q.correct_answer);
              const selectedOpt = opts.find((o) => o.id === selected);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const topicName = (q.topics as any)?.title as string | undefined;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-5 ${isCorrect ? "border-[#E6E4DE]" : "border-red-100"}`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCorrect ? "bg-green-50" : "bg-red-50"
                    }`}>
                      {isCorrect
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#0f172a] leading-snug">
                        <span className="text-[#94a3b8] mr-1">{i + 1}.</span>
                        {q.prompt}
                      </p>
                      {topicName && (
                        <p className="text-[11px] text-[#94a3b8] mt-1">{topicName}</p>
                      )}
                    </div>
                    {!isCorrect && topicName && (
                      <Link
                        href={`/student/ai-tutor?from=exam&subject=${encodeURIComponent(subject?.name ?? "")}&score=${pct}&correct=${totalCorrect}&total=${totalQuestions}&weak=${encodeURIComponent(topicName)}`}
                        title={`Ask AI Tutor about ${topicName}`}
                        className="flex-shrink-0 h-7 w-7 rounded-lg bg-[#EEF2FF] hover:bg-[#1B3A8A] text-[#1B3A8A] hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Brain className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* Options */}
                  <div className="pl-9 space-y-1.5 text-xs mb-4">
                    {opts.map((opt) => {
                      const isCorrectOpt = opt.id === q.correct_answer;
                      const isSelectedOpt = opt.id === selected;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            isCorrectOpt
                              ? "bg-green-50 text-green-700 font-medium"
                              : isSelectedOpt && !isCorrectOpt
                              ? "bg-red-50 text-red-700 font-medium"
                              : "text-[#94a3b8]"
                          }`}
                        >
                          <span className="font-bold uppercase w-4 flex-shrink-0">{opt.id}.</span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrectOpt && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />}
                          {isSelectedOpt && !isCorrectOpt && <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="pl-9">
                    {isCorrect ? (
                      <div className="rounded-xl bg-green-50 border border-green-100 p-4 space-y-1">
                        <p className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct — here&apos;s why
                        </p>
                        <p className="text-xs text-green-800 leading-relaxed">
                          <strong>{q.correct_answer.toUpperCase()}. &ldquo;{correctOpt?.text}&rdquo;</strong> is right.{" "}
                          {q.explanation ?? ""}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#E6E4DE] bg-[#FAFAFA] p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <XCircle className="h-3 w-3 text-red-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-red-600 mb-0.5">Your answer</p>
                            <p className="text-xs text-[#334155] leading-relaxed">
                              {selected
                                ? <><strong>{selected.toUpperCase()}. &ldquo;{selectedOpt?.text ?? "—"}&rdquo;</strong>
                                    {selectedOpt && <span className="text-[#64748B]"> — re-read the question carefully and compare with the correct answer below.</span>}
                                  </>
                                : <span className="text-[#94a3b8]">No answer given.</span>
                              }
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-[#E6E4DE]" />

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-green-700 mb-0.5">
                              Correct answer — {q.correct_answer.toUpperCase()}. &ldquo;{correctOpt?.text}&rdquo;
                            </p>
                            <p className="text-xs text-[#334155] leading-relaxed">
                              {q.explanation
                                ? q.explanation
                                : `The correct answer is ${q.correct_answer.toUpperCase()}: "${correctOpt?.text}".`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/student/exams/take?subject=${attempt.subject_id}`}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-[#E6E4DE] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8F7F4] transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </Link>
        {weakTopics.length > 0 ? (
          <Link
            href={`/student/ai-tutor?from=exam&subject=${encodeURIComponent(subject?.name ?? "")}&score=${pct}&correct=${totalCorrect}&total=${totalQuestions}&weak=${encodeURIComponent(weakTopics.map(t => t.name).join(","))}`}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1B3A8A] hover:bg-[#162f74] text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Brain className="h-4 w-4" /> Study with AI Tutor
          </Link>
        ) : (
          <Link
            href="/student/subjects"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1B3A8A] hover:bg-[#162f74] text-white text-sm font-bold transition-colors"
          >
            <BookOpen className="h-4 w-4" /> Study more
          </Link>
        )}
      </div>
    </div>
  );
}
