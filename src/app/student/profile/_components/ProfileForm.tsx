"use client";

import { useState } from "react";
import { Loader2, Save, Link2, RotateCcw, GraduationCap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { saveStudentProfile } from "../actions";

interface Props {
  userId: string;
  email: string;
  initial: {
    full_name: string;
    exam_target: string;
    phone: string;
    parent_phone: string;
    school: string;
    grade_level: string;
  };
  parentLinked: boolean;
}

const GRADES: Record<string, { value: string; label: string }[]> = {
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

export default function ProfileForm({ email, initial, parentLinked }: Props) {
  const [form, setForm] = useState(initial);
  // Snapshot of the last saved state — used to detect/discard unsaved edits.
  const [baseline, setBaseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [editingExam, setEditingExam] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Switching exam target clears a class that no longer belongs to it
  // (e.g. WASSCE selected while "JHS 2" was set).
  function changeExamTarget(target: string) {
    setForm((f) => {
      const stillValid = GRADES[target]?.some((g) => g.value === f.grade_level);
      return { ...f, exam_target: target, grade_level: stillValid ? f.grade_level : "" };
    });
  }

  function discard() {
    setForm(baseline);
    setEditingExam(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveStudentProfile(form);
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    setBaseline(form);          // new saved baseline
    setEditingExam(false);
    toast.success("Profile saved!");
  }

  const inputCls =
    "w-full h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/8 transition-all";
  const labelCls = "block text-sm font-semibold text-[#334155] mb-1.5";

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-[#0f172a]">Personal details</h2>

        <div>
          <label className={labelCls}>Full name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Kofi Mensah"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Email address</label>
          <input
            type="email"
            value={email}
            disabled
            className={`${inputCls} bg-[#F8FAFC] text-[#94a3b8] cursor-not-allowed`}
          />
          <p className="text-xs text-[#94a3b8] mt-1.5">Email cannot be changed here.</p>
        </div>

        <div>
          <label className={labelCls}>Your phone number <span className="font-normal text-[#94a3b8]">(optional)</span></label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="0244 123 456"
            className={inputCls}
          />
        </div>
      </div>

      {/* Parent linking section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#0f172a]">Parent / Guardian</h2>
          {parentLinked && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Link2 className="h-3 w-3" /> Linked
            </span>
          )}
        </div>

        <div>
          <label className={labelCls}>
            Parent&apos;s mobile number <span className="font-normal text-[#94a3b8]">(optional)</span>
          </label>
          <input
            type="tel"
            value={form.parent_phone}
            onChange={(e) => set("parent_phone", e.target.value)}
            placeholder="0244 123 456"
            className={inputCls}
          />
          <p className="text-xs text-[#94a3b8] mt-1.5">
            {parentLinked
              ? "Your parent is already linked. Update this if their number changes."
              : "When your parent signs up with this number, they'll be automatically linked to your account."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-[#0f172a]">Academic details</h2>

        <div>
          <label className={labelCls}>Exam target</label>

          {!editingExam ? (
            // Locked by default — chosen at registration, changing it switches
            // the whole curriculum, so it isn't a casual one-tap toggle.
            <div className="flex items-center justify-between gap-3 h-12 px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <GraduationCap className="h-4 w-4 text-[#1B3A8A]" />
                {form.exam_target === "wassce" ? "WASSCE · Senior High" : "BECE · Junior High"}
              </span>
              <button
                type="button"
                onClick={() => setEditingExam(true)}
                className="text-xs font-bold text-[#1D4ED8] hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(["BECE", "WASSCE"] as const).map((exam) => (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => changeExamTarget(exam.toLowerCase())}
                    className={`flex-1 h-11 rounded-xl border-2 text-sm font-bold transition-all ${
                      form.exam_target === exam.toLowerCase()
                        ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]"
                        : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#1D4ED8]/40"
                    }`}
                  >
                    {exam}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#D97706] flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                Changing this switches your entire curriculum — subjects, lessons, practice and mock exams.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>School / Institution</label>
          <input
            type="text"
            value={form.school}
            onChange={(e) => set("school", e.target.value)}
            placeholder="Accra Academy"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            Your class <span className="font-normal text-[#94a3b8]">({form.exam_target === "wassce" ? "SHS / Form" : "JHS"})</span>
          </label>
          <select
            value={form.grade_level}
            onChange={(e) => set("grade_level", e.target.value)}
            className={inputCls}
          >
            <option value="">Select your class</option>
            {(GRADES[form.exam_target] ?? GRADES.bece).map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action bar — only meaningful when there are unsaved edits */}
      <div className="flex items-center gap-3">
        {isDirty && (
          <button
            type="button"
            onClick={discard}
            disabled={saving}
            className="h-12 px-4 flex items-center gap-2 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-all disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" /> Discard
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.3)] text-sm"
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : isDirty
              ? <><Save className="h-4 w-4" /> Save changes</>
              : <>All changes saved</>}
        </button>
      </div>
    </form>
  );
}
