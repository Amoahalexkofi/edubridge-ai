"use client";

import { useState } from "react";
import { Phone, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { saveParentPhone } from "../actions";

export default function ParentPhoneForm({ currentPhone }: { currentPhone: string }) {
  const [phone, setPhone] = useState(currentPhone);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSaving(true);
    const result = await saveParentPhone(phone);
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Phone saved! You'll be linked to your ward automatically.");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0244 123 456"
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E2E8F0] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !phone.trim()}
        className="w-full h-11 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          : <><CheckCircle2 className="h-4 w-4" /> Save &amp; auto-link</>}
      </button>
    </form>
  );
}
