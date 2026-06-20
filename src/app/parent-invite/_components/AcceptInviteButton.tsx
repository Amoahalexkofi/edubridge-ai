"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInviteButton({ token, studentName }: { token: string; studentName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    const res = await fetch("/api/parent/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong");
      return;
    }

    toast.success(`Linked to ${studentName}!`);
    router.push("/parent");
  }

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="w-full h-12 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(22,163,74,0.35)] text-sm"
    >
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Linking…</>
        : <><Link2 className="h-4 w-4" /> Link to {studentName}</>}
    </button>
  );
}
