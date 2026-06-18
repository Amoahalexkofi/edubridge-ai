"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  email: string;
  initial: {
    full_name: string;
    exam_target: string;
    phone: string;
    school: string;
    grade_level: string;
  };
}

export default function ProfileForm({ userId, email, initial }: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...form, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved!");
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
          <label className={labelCls}>Phone number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+233 XX XXX XXXX"
            className={inputCls}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-[#0f172a]">Academic details</h2>

        <div>
          <label className={labelCls}>Exam target</label>
          <div className="flex gap-2">
            {(["BECE", "WASSCE"] as const).map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => set("exam_target", exam.toLowerCase())}
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
          <label className={labelCls}>Grade / Form level</label>
          <select
            value={form.grade_level}
            onChange={(e) => set("grade_level", e.target.value)}
            className={inputCls}
          >
            <option value="">Select grade</option>
            <optgroup label="Junior High School">
              <option value="JHS1">JHS 1</option>
              <option value="JHS2">JHS 2</option>
              <option value="JHS3">JHS 3</option>
            </optgroup>
            <optgroup label="Senior High School">
              <option value="SHS1">SHS 1 / Form 1</option>
              <option value="SHS2">SHS 2 / Form 2</option>
              <option value="SHS3">SHS 3 / Form 3</option>
            </optgroup>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.3)] text-sm"
      >
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save changes</>}
      </button>
    </form>
  );
}
