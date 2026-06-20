"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { saveOnboarding } from "../actions";

type ExamTarget = "bece" | "wassce";

const EXAMS: { value: ExamTarget; badge: string; label: string; description: string }[] = [
  { value: "bece",   badge: "JHS", label: "BECE",   description: "Junior High School (JHS 1–3)" },
  { value: "wassce", badge: "SHS", label: "WASSCE", description: "Senior High School (SHS 1–3)" },
];

const GRADES: Record<ExamTarget, { value: string; label: string }[]> = {
  bece: [
    { value: "JHS1", label: "JHS 1" },
    { value: "JHS2", label: "JHS 2" },
    { value: "JHS3", label: "JHS 3" },
  ],
  wassce: [
    { value: "SHS1", label: "SHS 1 / Form 1" },
    { value: "SHS2", label: "SHS 2 / Form 2" },
    { value: "SHS3", label: "SHS 3 / Form 3" },
  ],
};

export default function OnboardingForm() {
  const router = useRouter();
  const [examTarget, setExamTarget] = useState<ExamTarget | null>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!examTarget) { toast.error("Please choose BECE or WASSCE."); return; }
    setSaving(true);
    const result = await saveOnboarding({ exam_target: examTarget, grade_level: gradeLevel });
    if (result.error) {
      setSaving(false);
      toast.error(result.error);
      return;
    }
    toast.success("You're all set!");
    // Hard navigation so the student layout re-reads the now-set exam_target.
    router.replace("/student");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Exam target */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#334155]">What are you preparing for?</label>
        <div className="grid grid-cols-2 gap-3">
          {EXAMS.map((opt) => {
            const active = examTarget === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setExamTarget(opt.value); setGradeLevel(""); }}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  active ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${
                  active ? "bg-[#1D4ED8] text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {opt.badge}
                </span>
                <p className={`font-black text-sm ${active ? "text-[#1D4ED8]" : "text-[#0f172a]"}`}>{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade level */}
      {examTarget && (
        <div className="space-y-2">
          <label htmlFor="gradeLevel" className="block text-sm font-semibold text-[#334155]">
            Your class <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <select
            id="gradeLevel"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[#0f172a] text-sm focus:outline-none focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/8 transition-all"
          >
            <option value="">Select your class</option>
            {GRADES[examTarget].map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !examTarget}
        className="w-full h-12 flex items-center justify-center gap-2 bg-[#1B3A8A] hover:bg-[#162f74] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_4px_14px_rgba(27,58,138,0.3)]"
      >
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Start learning <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
