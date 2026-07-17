"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Only shown for teacher rows. Approved teachers can author content; unapproved
// ones are blocked until an admin flips this on.
export default function ContentApprovalToggle({ userId, approved }: { userId: string; approved: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !approved;
    setSaving(true);
    const res = await fetch("/api/admin/users/content-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update approval");
      return;
    }
    toast.success(next ? "Content access approved" : "Content access revoked");
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={approved ? "Approved to publish content — click to revoke" : "Approve this teacher to publish content"}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-bold transition-colors disabled:opacity-60 ${
        approved
          ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
          : "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
      }`}
    >
      {saving
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : approved
          ? <><CheckCircle2 className="h-3.5 w-3.5" /> Approved</>
          : <><Clock className="h-3.5 w-3.5" /> Approve</>}
    </button>
  );
}
