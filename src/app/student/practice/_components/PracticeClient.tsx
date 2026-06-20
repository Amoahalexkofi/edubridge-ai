"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Trophy, BookOpen, PenLine, GraduationCap, Target, ChevronRight,
} from "lucide-react";

type Subject = { id: string; name: string; slug: string; icon: string | null };
type Question = {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation: string | null;
  topic_id: string;
  topics: { title: string } | null;
};

interface Props {
  subjects: Subject[];
  activeSubjectId: string | null;
  questions: Question[];
  examTarget: string;
}

export default function PracticeClient({ subjects, activeSubjectId, questions, examTarget }: Props) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions[currentIdx];
  const isCorrect = selectedOption === current?.correct_answer;
  const isLast = currentIdx === questions.length - 1;
  const examLabel = examTarget.toUpperCase();

  function handleSelect(optionId: string) {
    if (revealed) return;
    setSelectedOption(optionId);
    setRevealed(true);
    if (optionId === current.correct_answer) setScore((s) => s + 1);
  }

  function handleNext() {
    if (isLast) {
      setDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setRevealed(false);
    }
  }

  function handleRestart() {
    setCurrentIdx(0);
    setSelectedOption(null);
    setRevealed(false);
    setScore(0);
    setDone(false);
  }

  // ── No subjects at all ────────────────────────────────────────
  if (subjects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-20 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto">
            <PenLine className="h-8 w-8 text-[#94a3b8]" />
          </div>
          <p className="font-semibold text-[#334155]">No practice questions yet</p>
          <p className="text-sm text-[#94a3b8]">Questions will appear here once teachers add them.</p>
        </div>
      </div>
    );
  }

  // ── Subject selected but no questions ─────────────────────────
  if (questions.length === 0 && activeSubjectId) {
    const activeSubject = subjects.find((s) => s.id === activeSubjectId);
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-dashed border-[#E8ECF0] py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[#FFF7ED] flex items-center justify-center mx-auto text-3xl">
            {activeSubject?.icon ?? "📚"}
          </div>
          <div>
            <p className="font-semibold text-[#334155]">No questions for {activeSubject?.name ?? "this subject"} yet</p>
            <p className="text-sm text-[#94a3b8] mt-1">Questions are being added — check back soon.</p>
          </div>
          <button
            onClick={() => router.push("/student/practice")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors"
          >
            Choose another subject
          </button>
        </div>
      </div>
    );
  }

  // ── Subject picker (no subject selected) ───────────────────────
  if (questions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Header — orange brand gradient, action-oriented */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E8722A] via-[#f97316] to-[#f59e0b] p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full bg-white/10" />

          <div className="relative space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
              <Target className="h-3 w-3" /> Practice Mode · {examLabel}
            </span>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-white leading-tight">
                Sharpen your <span className="text-yellow-200">skills</span>
              </h1>
              <p className="text-white/80 text-sm mt-2">
                Pick a subject and answer MCQ questions to build confidence before the real exam.
              </p>
            </div>

            <div className="flex items-center gap-5 pt-1">
              <div>
                <p className="text-2xl font-black text-white">{subjects.length}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Subjects</p>
              </div>
              <div className="w-px h-7 bg-white/30" />
              <div>
                <p className="text-2xl font-black text-white">MCQ</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Format</p>
              </div>
              <div className="w-px h-7 bg-white/30" />
              <div>
                <p className="text-2xl font-black text-white">Instant</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Feedback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/student/practice?subject=${s.id}`)}
              className="group bg-white rounded-2xl border border-[#E8ECF0] p-5 flex flex-col gap-4 hover:border-[#1D4ED8]/30 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-[#F8FAFC] border border-[#E8ECF0] flex items-center justify-center text-2xl">
                  {s.icon ?? "📚"}
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#E8722A]">
                  <GraduationCap className="h-3 w-3" /> {examLabel}
                </span>
              </div>

              <div className="flex-1">
                <p className="font-semibold text-[15px] text-[#0f172a] leading-snug group-hover:text-[#1D4ED8] transition-colors">
                  {s.name}
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">Tap to start practice</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8]">Multiple choice</span>
                <ChevronRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#1D4ED8] transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const grade =
      pct >= 80 ? "Excellent!" :
      pct >= 60 ? "Good work!" :
      pct >= 40 ? "Keep going!" : "Keep practising!";
    const gradeColor =
      pct >= 80 ? "text-[#16A34A]" :
      pct >= 60 ? "text-[#1D4ED8]" :
      pct >= 40 ? "text-[#D97706]" : "text-[#DC2626]";
    const barColor =
      pct >= 60 ? "bg-green-500" :
      pct >= 40 ? "bg-amber-500" : "bg-rose-500";

    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-3xl border border-[#E8ECF0] p-8 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-[#EFF6FF] border-4 border-[#BFDBFE] flex items-center justify-center mx-auto">
            <Trophy className="h-9 w-9 text-[#1D4ED8]" />
          </div>

          <div>
            <p className={`text-2xl font-black ${gradeColor}`}>{grade}</p>
            <p className="text-[#64748B] text-sm mt-1">Practice complete</p>
          </div>

          <div className="py-4 border-y border-[#F1F5F9]">
            <p className="text-6xl font-black text-[#0f172a] tabular-nums">{pct}<span className="text-3xl text-[#94a3b8]">%</span></p>
            <p className="text-sm text-[#64748B] mt-2">{score} of {questions.length} correct</p>
          </div>

          <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E8ECF0] text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <button
              onClick={() => router.push("/student/subjects")}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors"
            >
              <BookOpen className="h-4 w-4" /> Study more
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz view ─────────────────────────────────────────────────
  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const progressPct = ((currentIdx + (revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8ECF0] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F8FAFC] border border-[#E8ECF0] flex items-center justify-center text-xl">
            {activeSubject?.icon ?? "📚"}
          </div>
          <div>
            <p className="font-semibold text-sm text-[#0f172a]">{activeSubject?.name}</p>
            <p className="text-xs text-[#94a3b8]">{examLabel} Practice</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#94a3b8]">Question</p>
          <p className="text-lg font-black text-[#0f172a] tabular-nums">
            {currentIdx + 1}<span className="text-sm font-medium text-[#94a3b8]">/{questions.length}</span>
          </p>
        </div>
      </div>

      {/* Progress + score row */}
      <div className="space-y-2">
        <div className="h-1.5 bg-[#E8ECF0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-[#16A34A] font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> {score} correct
          </span>
          <span className="text-[#94a3b8]">{questions.length - currentIdx - 1} remaining</span>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-[#E8ECF0] p-5 sm:p-6 space-y-5">
        {current.topics?.title && (
          <span className="inline-block text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-full uppercase tracking-wider">
            {current.topics.title}
          </span>
        )}
        <p className="text-sm sm:text-base font-semibold text-[#0f172a] leading-relaxed">
          {current.prompt}
        </p>

        <div className="space-y-2.5">
          {current.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOpt = opt.id === current.correct_answer;

            let cls = "border-[#E8ECF0] bg-white text-[#334155] hover:border-[#1D4ED8]/40 hover:bg-[#F8FAFC]";
            if (revealed) {
              if (isCorrectOpt) cls = "border-green-300 bg-green-50 text-green-800";
              else if (isSelected) cls = "border-red-300 bg-red-50 text-red-800";
              else cls = "border-[#E8ECF0] bg-white text-[#94a3b8] opacity-50";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={revealed}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all disabled:cursor-default ${cls}`}
              >
                <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  revealed && isCorrectOpt ? "border-green-400 bg-green-400 text-white" :
                  revealed && isSelected   ? "border-red-400 bg-red-400 text-white" :
                  "border-current"
                }`}>
                  {opt.id.toUpperCase()}
                </span>
                <span className="flex-1">{opt.text}</span>
                {revealed && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {revealed && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <div className={`rounded-xl p-4 text-sm border ${
            isCorrect ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
          }`}>
            <p className="font-bold mb-1">{isCorrect ? "Correct!" : "Not quite."}</p>
            {current.explanation && (
              <p className="leading-relaxed text-xs opacity-90">{current.explanation}</p>
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      {revealed && (
        <button
          onClick={handleNext}
          className="w-full h-12 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold rounded-xl transition-colors"
        >
          {isLast ? "See results" : "Next question"}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
