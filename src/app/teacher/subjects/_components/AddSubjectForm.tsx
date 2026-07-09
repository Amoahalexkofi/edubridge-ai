"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const EMOJIS = ["📚", "📐", "📝", "🔬", "🌍", "💻", "🇫🇷", "✝️", "🔧", "📊", "⚗️", "🧬", "🌱", "🗺️"];

interface Props {
  onSuccess?: () => void;
}

export default function AddSubjectForm({ onSuccess }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [examType, setExamType] = useState<"BECE" | "WASSCE">("BECE");
  const [icon, setIcon] = useState("📚");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      + "-" + examType.toLowerCase();

    const supabase = createClient();
    const { error } = await supabase.from("subjects").insert({
      name: name.trim(),
      slug,
      exam_type: examType.toLowerCase() as "bece" | "wassce",
      icon,
      description: description.trim() || null,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${name}" added!`);
    setName("");
    setDescription("");
    onSuccess?.();
    router.refresh();
  }

  const inputCls = "h-10 px-3 rounded-xl border border-[#E6E4DE] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all";

  return (
    <form onSubmit={handleAdd} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subject name (e.g. Mathematics)"
          required
          className={`${inputCls} sm:col-span-2`}
        />
        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value as "BECE" | "WASSCE")}
          className={inputCls}
        >
          <option value="BECE">BECE</option>
          <option value="WASSCE">WASSCE</option>
        </select>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        className={`w-full ${inputCls}`}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs font-semibold text-[#64748B]">Icon:</p>
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setIcon(e)}
            className={`h-8 w-8 rounded-lg text-lg flex items-center justify-center transition-all ${
              icon === e ? "bg-[#EFF6FF] ring-2 ring-[#1D4ED8]" : "bg-[#F8F7F4] hover:bg-[#EFF6FF]"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add subject
      </button>
    </form>
  );
}
