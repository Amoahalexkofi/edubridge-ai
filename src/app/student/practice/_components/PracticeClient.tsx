"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Trophy, BookOpen, PenLine,
} from "lucide-react";

type Subject = { id: string; name: string; slug: string; icon: string | null };
type Question = {
  id: string;
  body: string;
  options: Array<{ id: string; text: string }>;
  correct_option: string;
  explanation: string | null;
  topic_id: string;
  topics: { name: string } | null;
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
  const isCorrect = selectedOption === current?.correct_option;
  const isLast = currentIdx === questions.length - 1;

  function handleSelect(optionId: string) {
    if (revealed) return;
    setSelectedOption(optionId);
    setRevealed(true);
    if (optionId === current.correct_option) setScore((s) => s + 1);
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

  // ── Subject picker state (shown when no questions) ──
  if (subjects.length > 0 && questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Practice</h1>
          <p className="text-sm text-[#64748B] mt-1">Select a subject to start practising</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/student/practice?subject=${s.id}`)}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col gap-3 hover:border-[#1D4ED8]/40 hover:shadow-md transition-all text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-xl">
                {s.icon ?? "📚"}
              </div>
              <div>
                <p className="font-bold text-sm text-[#0f172a]">{s.name}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{examTarget}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-16 text-center">
          <PenLine className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155]">No practice questions yet</p>
          <p className="text-sm text-[#94a3b8] mt-1">
            Questions will appear here once teachers add them.
          </p>
        </div>
      </div>
    );
  }

  // ── Results screen ──
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work!" : pct >= 40 ? "Keep going!" : "Keep practising!";
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 text-center">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
          <div className="h-20 w-20 rounded-full bg-[#EFF6FF] border-4 border-[#BFDBFE] flex items-center justify-center mx-auto mb-5">
            <Trophy className="h-9 w-9 text-[#1D4ED8]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0f172a] mb-1">{grade}</h2>
          <p className="text-[#64748B] text-sm mb-6">You scored</p>
          <div className="text-5xl font-black text-[#1D4ED8] mb-1 tabular-nums">{pct}%</div>
          <p className="text-sm text-[#64748B] mb-8">{score} of {questions.length} correct</p>

          <div className="h-3 bg-[#E2E8F0] rounded-full overflow-hidden mb-8">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors"
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

  // ── Subject tabs + question ──
  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">Practice</h1>
          <p className="text-xs text-[#64748B] mt-0.5">{activeSubject?.icon} {activeSubject?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#64748B]">Question</p>
          <p className="text-lg font-black text-[#0f172a] tabular-nums">
            {currentIdx + 1}<span className="text-sm font-semibold text-[#94a3b8]">/{questions.length}</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
          style={{ width: `${((currentIdx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Score badge */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {score} correct so far
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6">
        {current.topics?.name && (
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
            {current.topics.name}
          </p>
        )}
        <p className="text-sm sm:text-base font-semibold text-[#0f172a] leading-relaxed mb-5">
          {current.body}
        </p>

        <div className="space-y-2.5">
          {current.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOpt = opt.id === current.correct_option;

            let cls = "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#1D4ED8]/40 hover:bg-[#F8FAFC]";
            if (revealed) {
              if (isCorrectOpt) cls = "border-green-400 bg-green-50 text-green-800";
              else if (isSelected && !isCorrectOpt) cls = "border-red-400 bg-red-50 text-red-800";
              else cls = "border-[#E2E8F0] bg-white text-[#94a3b8] opacity-60";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={revealed}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all disabled:cursor-default ${cls}`}
              >
                <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  revealed && isCorrectOpt
                    ? "border-green-400 bg-green-400 text-white"
                    : revealed && isSelected && !isCorrectOpt
                    ? "border-red-400 bg-red-400 text-white"
                    : "border-current"
                }`}>
                  {opt.id.toUpperCase()}
                </span>
                {opt.text}
                {revealed && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
                {revealed && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-500 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <div className={`mt-4 rounded-xl p-4 text-sm border ${
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
