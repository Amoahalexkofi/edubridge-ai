"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck, BookOpen, PenLine, FileText, SearchCheck,
  Loader2, Sparkles, RotateCcw, ChevronDown, Check, Brain,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StudyPlan, PlanItem } from "@/lib/study-plan";

interface SubjectOption {
  id: string;
  name: string;
  icon: string | null;
  topicCount: number;
}

interface Props {
  firstName: string;
  examTarget: "BECE" | "WASSCE";
  subjects: SubjectOption[];
  initialPlan: { id: string; examDate: string; plan: StudyPlan } | null;
}

const ITEM_META: Record<PlanItem["type"], { icon: typeof BookOpen; tint: string }> = {
  study:    { icon: BookOpen,    tint: "bg-blue-50 text-[#1D4ED8]" },
  practice: { icon: PenLine,     tint: "bg-amber-50 text-amber-600" },
  exam:     { icon: FileText,    tint: "bg-purple-50 text-purple-600" },
  review:   { icon: SearchCheck, tint: "bg-teal-50 text-[#0D9488]" },
};

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86_400_000));
}

export default function PlannerClient({ firstName, examTarget, subjects, initialPlan }: Props) {
  const [record, setRecord] = useState(initialPlan);
  const [examDate, setExamDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));

  const progress = useMemo(() => {
    if (!record) return { done: 0, total: 0, pct: 0 };
    let done = 0, total = 0;
    for (const w of record.plan.weeks) for (const i of w.items) { total++; if (i.done) done++; }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [record]);

  function toggleSubject(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function generate() {
    if (!examDate) { setError("Choose your exam date first."); return; }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/student/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate, subjectIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setRecord({ id: data.id, examDate: data.exam_date, plan: data.plan });
      setOpenWeeks(new Set([1]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleItem(weekIndex: number, itemId: string) {
    if (!record) return;
    const plan: StudyPlan = {
      ...record.plan,
      weeks: record.plan.weeks.map(w =>
        w.index !== weekIndex ? w : { ...w, items: w.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) },
      ),
    };
    setRecord({ ...record, plan });
    createClient()
      .from("study_plans")
      .update({ plan, updated_at: new Date().toISOString() })
      .eq("id", record.id)
      .then(({ error: err }) => { if (err) console.warn("[planner] save failed:", err.message); });
  }

  function startOver() {
    setRecord(null);
    setExamDate("");
    setSelected(new Set());
    fetch("/api/student/study-plan", { method: "DELETE" }).catch(() => {});
  }

  // ── Setup (no plan yet) ────────────────────────────────────────────────
  if (!record) {
    const minDate = new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10);
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-[#1B3A8A]" /> Study Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Tell us when your {examTarget} starts and we&apos;ll build your week-by-week revision
            plan — weakest topics first, a mock exam every week.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 sm:p-6 mb-4">
          <label htmlFor="exam-date" className="block text-sm font-bold text-slate-900 mb-2">
            When is your {examTarget} exam?
          </label>
          <input
            id="exam-date"
            type="date"
            min={minDate}
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            className="w-full h-11 rounded-xl border border-[#E6E4DE] bg-white px-4 text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 transition-all"
          />
          {examDate && (
            <p className="text-xs text-slate-500 mt-2">
              That&apos;s <span className="font-bold text-[#1B3A8A]">{daysUntil(examDate)} days</span> from today.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 sm:p-6 mb-5">
          <p className="text-sm font-bold text-slate-900 mb-1">Focus subjects</p>
          <p className="text-xs text-slate-500 mb-4">Leave all unticked to plan across every subject.</p>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map(s => {
              const on = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-[13px] font-semibold transition-all ${
                    on
                      ? "border-[#1B3A8A] bg-[#1B3A8A]/5 text-[#1B3A8A]"
                      : "border-[#E6E4DE] text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className={`h-4 w-4 rounded flex-shrink-0 border flex items-center justify-center ${
                    on ? "bg-[#1B3A8A] border-[#1B3A8A]" : "border-slate-300"
                  }`}>
                    {on && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="truncate">{s.icon ? `${s.icon} ` : ""}{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        <button
          onClick={generate}
          disabled={generating || !examDate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E8722A] hover:bg-[#d4641e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-sm"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Building your plan…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate my plan</>
          )}
        </button>
      </div>
    );
  }

  // ── Plan view ──────────────────────────────────────────────────────────
  const days = daysUntil(record.examDate);
  const currentWeekIdx = record.plan.weeks.find(w => w.items.some(i => !i.done))?.index ?? record.plan.weeks.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-[#1B3A8A]" /> Your study plan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {examTarget} in <span className="font-bold text-[#E8722A]">{days} days</span> ·{" "}
            {record.plan.weeks.length} weeks · {progress.done}/{progress.total} tasks done
          </p>
        </div>
        <button
          onClick={startOver}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1B3A8A] px-3 py-2 rounded-xl hover:bg-[#F1F0EC] transition-colors flex-shrink-0"
          title="Delete this plan and build a new one"
        >
          <RotateCcw className="h-3.5 w-3.5" /> New plan
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Overall progress</p>
          <p className="text-sm font-black text-[#1B3A8A] tabular-nums">{progress.pct}%</p>
        </div>
        <div className="h-2 rounded-full bg-[#F1F0EC] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8] transition-all duration-300"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      {/* Coach note */}
      {record.plan.coachNote && (
        <div className="flex gap-3 bg-gradient-to-r from-[#1B3A8A] to-[#2d4fa0] rounded-2xl p-4 sm:p-5 mb-6 text-white">
          <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Brain className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">From your AI coach</p>
            <p className="text-sm leading-relaxed text-blue-50">{record.plan.coachNote}</p>
          </div>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-3">
        {record.plan.weeks.map(week => {
          const done = week.items.filter(i => i.done).length;
          const isOpen = openWeeks.has(week.index) || week.index === currentWeekIdx;
          const isCurrent = week.index === currentWeekIdx;
          const complete = done === week.items.length && week.items.length > 0;
          return (
            <div
              key={week.index}
              className={`bg-white rounded-2xl border transition-colors ${
                isCurrent ? "border-[#1B3A8A]/40" : "border-[#E6E4DE]"
              }`}
            >
              <button
                onClick={() =>
                  setOpenWeeks(prev => {
                    const next = new Set(prev);
                    if (next.has(week.index)) next.delete(week.index); else next.add(week.index);
                    return next;
                  })
                }
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
              >
                <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  complete ? "bg-green-50 text-[#1A6B3C]" : isCurrent ? "bg-[#1B3A8A] text-white" : "bg-[#F1F0EC] text-slate-500"
                }`}>
                  {complete ? <Check className="h-4 w-4" /> : week.index}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Week {week.index}</span>
                    {isCurrent && !complete && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8722A]/10 text-[#E8722A]">This week</span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">{week.focus} · {done}/{week.items.length} done</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <ul className="px-4 sm:px-5 pb-4 space-y-1.5">
                  {week.items.map(item => {
                    const meta = ITEM_META[item.type];
                    const Icon = meta.icon;
                    return (
                      <li key={item.id} className="flex items-center gap-3 group">
                        {/* 44px hit area around a 20px visual checkbox (mobile tap-target rule) */}
                        <button
                          onClick={() => toggleItem(week.index, item.id)}
                          aria-label={item.done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
                          className="h-11 w-11 -my-2 -ml-3 flex items-center justify-center flex-shrink-0 group/check"
                        >
                          <span className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                            item.done ? "bg-[#1A6B3C] border-[#1A6B3C]" : "border-slate-300 group-hover/check:border-[#1B3A8A]"
                          }`}>
                            {item.done && <Check className="h-3.5 w-3.5 text-white" />}
                          </span>
                        </button>
                        <span className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.tint}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <Link
                          href={item.href}
                          className={`flex-1 min-w-0 text-[13px] leading-snug py-1 ${
                            item.done ? "text-slate-400 line-through" : "text-slate-700 group-hover:text-[#1B3A8A]"
                          } transition-colors`}
                        >
                          <span className="font-medium">{item.title}</span>
                          {item.subjectName && (
                            <span className="text-slate-400 font-normal"> · {item.subjectName}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
        {firstName}, tick tasks off as you finish them — your plan is saved to your account
        and follows you on any device.
      </p>
    </div>
  );
}
