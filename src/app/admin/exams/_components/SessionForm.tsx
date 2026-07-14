"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Subject = { id: string; name: string; exam_type: string };

export default function SessionForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [questionCount, setQuestionCount] = useState(40);
  const [duration, setDuration] = useState(40);

  function reset() {
    setTitle(""); setSubjectId(""); setStartsAt(""); setEndsAt("");
    setQuestionCount(40); setDuration(40);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Give the session a title."); return; }
    if (!subjectId) { toast.error("Choose a subject."); return; }
    if (!startsAt || !endsAt) { toast.error("Set the open and close times."); return; }
    const s = new Date(startsAt).getTime();
    const en = new Date(endsAt).getTime();
    if (en <= s) { toast.error("The close time must be after the open time."); return; }
    if (questionCount < 1 || duration < 1) { toast.error("Questions and duration must be at least 1."); return; }

    const subject = subjects.find((x) => x.id === subjectId);
    setSaving(true);
    const { error } = await createClient().from("exam_sessions").insert({
      title: title.trim(),
      subject_id: subjectId,
      exam_type: subject?.exam_type,
      question_count: questionCount,
      duration_minutes: duration,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mock exam session scheduled!");
    reset();
    setOpen(false);
    router.refresh();
  }

  const inputCls = "w-full h-11 px-4 rounded-xl border border-[#E6E4DE] bg-white text-[#0f172a] text-sm focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors"
      >
        <Plus className="h-4 w-4" /> Schedule session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          <div className="w-full max-w-lg bg-[#F4F3EF] h-full overflow-y-auto shadow-[-8px_0_40px_rgba(0,0,0,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur border-b border-[#E6E4DE] px-5 h-14">
              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[#1D4ED8]" /> Schedule a mock exam
              </p>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg text-slate-500 hover:bg-[#F2F1EE] flex items-center justify-center" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save} className="p-5 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1.5">Session title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mathematics Mock #3" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1.5">Subject</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls} required>
                    <option value="">Select subject…</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.exam_type.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1.5">Opens</label>
                    <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1.5">Closes</label>
                    <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1.5">Questions</label>
                    <input type="number" min={1} max={100} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1.5">Duration (min)</label>
                    <input type="number" min={1} max={240} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls} />
                  </div>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Students whose target is this subject&apos;s exam can join any time between Opens and Closes. Questions are drawn at random from the subject&apos;s topics.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm shadow-[0_4px_14px_rgba(232,114,42,0.3)]"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling…</> : <><CalendarClock className="h-4 w-4" /> Schedule session</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
