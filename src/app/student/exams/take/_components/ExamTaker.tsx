"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  attemptId: string;
  subject: { id: string; name: string; icon: string | null; exam_type: string };
  questions: Question[];
  durationMinutes: number;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function ExamTaker({ attemptId, subject, questions, durationMinutes }: Props) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const submitted = useRef(false);

  const current = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft < 300;

  async function submitExam(auto = false) {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);

    try {
      const res = await fetch("/api/student/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed");
      }

      router.replace(`/student/exams/${attemptId}`);
    } catch (err) {
      console.error(err);
      submitted.current = false;
      setSubmitting(false);
      toast.error("Could not submit exam. Please try again.");
    }
  }

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      submitExam(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F1EE]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[#1D4ED8] animate-spin mx-auto mb-4" />
          <p className="font-semibold text-[#334155]">Marking your exam…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F1EE]">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E6E4DE] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{subject.icon ?? "📚"}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0f172a] truncate">{subject.name}</p>
              <p className="text-xs text-[#94a3b8]">{answered}/{questions.length} answered</p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-sm tabular-nums flex-shrink-0 ${
            isLow
              ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
              : "bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]"
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {pad(minutes)}:{pad(seconds)}
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors flex-shrink-0 disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Question area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Progress dots — ≥44px tap targets (timed exam, thumb navigation) */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              aria-label={`Go to question ${i + 1}${answers[q.id] ? " (answered)" : ""}`}
              className={`h-11 w-11 sm:h-9 sm:w-9 rounded-lg text-sm font-bold transition-all ${
                i === currentIdx
                  ? "bg-[#1D4ED8] text-white scale-105"
                  : answers[q.id]
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-white text-[#94a3b8] border border-[#E6E4DE]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 sm:p-6">
          {current.topics?.title && (
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              {current.topics.title}
            </p>
          )}
          <p className="text-sm font-semibold text-[#64748B] mb-3">
            Question {currentIdx + 1} of {questions.length}
          </p>
          <p className="text-sm sm:text-base font-semibold text-[#0f172a] leading-relaxed mb-5">
            {current.prompt}
          </p>

          <div className="space-y-2.5">
            {current.options.map((opt) => {
              const isSelected = answers[current.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswers((a) => ({ ...a, [current.id]: opt.id }))}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    isSelected
                      ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1e40af]"
                      : "border-[#E6E4DE] bg-white text-[#334155] hover:border-[#1D4ED8]/40 hover:bg-[#F8F7F4]"
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isSelected ? "border-[#1D4ED8] bg-[#1D4ED8] text-white" : "border-current"
                  }`}>
                    {opt.id.toUpperCase()}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prev / Next */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-white border border-[#E6E4DE] text-sm font-semibold text-[#475569] hover:bg-[#F8F7F4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-white border border-[#E6E4DE] text-sm font-semibold text-[#475569] hover:bg-[#F8F7F4] transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors"
            >
              Finish <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] text-center mb-2">Submit exam?</h3>
            <p className="text-sm text-[#64748B] text-center mb-6">
              You have answered <strong>{answered}</strong> of <strong>{questions.length}</strong> questions.
              {answered < questions.length && " Unanswered questions will be marked incorrect."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-[#E6E4DE] text-sm font-semibold text-[#475569] hover:bg-[#F8F7F4] transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={() => { setShowConfirm(false); submitExam(); }}
                className="flex-1 h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors"
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
