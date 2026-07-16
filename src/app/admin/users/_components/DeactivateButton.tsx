"use client";

import { useState } from "react";
import { Loader2, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeactivateButton({
  userId,
  deactivated,
  isSelf,
  targetRole,
  callerRole,
}: {
  userId: string;
  deactivated: boolean;
  isSelf: boolean;
  targetRole: string;
  callerRole: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  if (isSelf) return null; // can't deactivate yourself
  // Super admins are untouchable; only a super admin may deactivate an admin.
  if (targetRole === "super_admin") return null;
  if (targetRole === "admin" && callerRole !== "super_admin") return null;

  async function toggle() {
    const next = !deactivated;
    if (next && !confirm("Deactivate this account? The user won't be able to sign in until you reactivate them.")) return;
    setSaving(true);
    const res = await fetch("/api/admin/users/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deactivate: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update account");
      return;
    }
    toast.success(next ? "Account deactivated" : "Account reactivated");
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={deactivated ? "Reactivate account" : "Deactivate account"}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-colors disabled:opacity-60 ${
        deactivated
          ? "border-green-200 text-green-600 hover:bg-green-50"
          : "border-[#E6E4DE] text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
      }`}
    >
      {saving
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : deactivated
          ? <RotateCcw className="h-3.5 w-3.5" />
          : <Ban className="h-3.5 w-3.5" />}
    </button>
  );
}
