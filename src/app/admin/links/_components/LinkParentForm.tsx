"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = { id: string; full_name: string | null };

export default function LinkParentForm({ parents, students }: { parents: Profile[]; students: Profile[] }) {
  const router = useRouter();
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !studentId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("parent_student").insert({
      parent_id: parentId,
      student_id: studentId,
    });
    setSaving(false);
    if (error) { toast.error(error.message.includes("unique") ? "This link already exists." : error.message); return; }
    toast.success("Parent linked to student!");
    setParentId("");
    setStudentId("");
    router.refresh();
  }

  const selectCls = "h-11 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0f172a] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all";

  return (
    <form onSubmit={handleLink} className="flex items-end gap-3 flex-wrap">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Parent</label>
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} required className={`w-full ${selectCls}`}>
          <option value="">Select parent…</option>
          {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name ?? p.id}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Student (ward)</label>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className={`w-full ${selectCls}`}>
          <option value="">Select student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.full_name ?? s.id}</option>)}
        </select>
      </div>
      <button type="submit" disabled={saving || !parentId || !studentId} className="h-11 px-5 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Link
      </button>
    </form>
  );
}
