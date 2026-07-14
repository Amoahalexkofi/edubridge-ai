"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this session? Students' attempts are kept but will no longer be linked to a session.")) return;
    setDeleting(true);
    const { error } = await createClient().from("exam_sessions").delete().eq("id", sessionId);
    if (error) { setDeleting(false); toast.error(error.message); return; }
    toast.success("Session deleted.");
    router.push("/admin/exams");
  }

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-60"
    >
      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
    </button>
  );
}
