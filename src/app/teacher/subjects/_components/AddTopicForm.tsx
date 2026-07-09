"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  subjectId: string;
  nextOrder: number;
}

export default function AddTopicForm({ subjectId, nextOrder }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("topics").insert({
      subject_id: subjectId,
      title: name.trim(),
      order_index: nextOrder,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Topic "${name}" added!`);
    setName("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#1D4ED8] hover:underline font-semibold"
      >
        <Plus className="h-3.5 w-3.5" /> Add topic
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Topic name"
        autoFocus
        required
        className="flex-1 h-9 px-3 rounded-xl border border-[#E6E4DE] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all"
      />
      <button
        type="submit"
        disabled={saving}
        className="h-9 px-3 rounded-xl bg-[#1D4ED8] text-white text-sm font-semibold disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 rounded-xl border border-[#E6E4DE] text-sm text-[#64748B]">
        Cancel
      </button>
    </form>
  );
}
