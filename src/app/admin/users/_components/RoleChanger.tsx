"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ROLES = ["student", "teacher", "parent", "admin"] as const;
type Role = (typeof ROLES)[number];

const colors: Record<Role, string> = {
  student: "bg-blue-50 text-blue-700 border-blue-200",
  teacher: "bg-orange-50 text-[#E8722A] border-orange-200",
  parent:  "bg-green-50 text-green-700 border-green-200",
  admin:   "bg-slate-100 text-slate-800 border-slate-300",
};

export default function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole as Role);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function changeRole(newRole: Role) {
    if (newRole === role) { setOpen(false); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });
    setSaving(false);
    setOpen(false);
    if (error) { toast.error(error.message); return; }
    setRole(newRole);
    toast.success(`Role changed to ${newRole}`);
    router.refresh();
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${colors[role] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {role}
        <span className="text-[10px] opacity-60">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden min-w-[110px]">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => changeRole(r)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-[#F8FAFC] transition-colors ${r === role ? "text-[#1D4ED8]" : "text-[#334155]"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
