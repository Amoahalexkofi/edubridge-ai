"use client";

import { useState } from "react";
import { Loader2, BadgeCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function VerifyButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function verify() {
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/admin/users/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to verify user");
      return;
    }
    toast.success("Email verified");
    router.refresh();
  }

  return (
    <button
      onClick={verify}
      disabled={saving}
      title="Manually verify this user's email"
      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline disabled:opacity-60"
    >
      {saving
        ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
        : <AlertTriangle className="h-2.5 w-2.5" />}
      Email not verified · <span className="inline-flex items-center gap-0.5 text-[#1A6B3C]"><BadgeCheck className="h-2.5 w-2.5" /> Verify</span>
    </button>
  );
}
