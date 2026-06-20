"use client";

import { useState } from "react";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ROLES = ["student", "teacher", "parent", "admin"] as const;
type Role = (typeof ROLES)[number];

const roleStyles: Record<Role, { pill: string; dot: string; label: string }> = {
  student: { pill: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500",   label: "Student" },
  teacher: { pill: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", label: "Teacher" },
  parent:  { pill: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500",  label: "Parent"  },
  admin:   { pill: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", label: "Admin"   },
};

export default function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole as Role);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const style = roleStyles[role] ?? roleStyles.student;

  async function changeRole(newRole: Role) {
    if (newRole === role) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    const res = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update role");
      return;
    }
    setRole(newRole);
    toast.success(`Role updated to ${newRole}`);
    router.refresh();
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border text-xs font-semibold transition-all hover:opacity-80 ${style.pill}`}
      >
        {saving
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        }
        {style.label}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 z-50 w-36 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
            {ROLES.map((r) => {
              const s = roleStyles[r];
              return (
                <button
                  key={r}
                  onClick={() => changeRole(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <span className="flex-1 text-left">{s.label}</span>
                  {r === role && <Check className="h-3 w-3 text-slate-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
