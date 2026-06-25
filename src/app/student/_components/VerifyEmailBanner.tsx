"use client";

import { useState } from "react";
import { MailWarning, Loader2, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  async function resend() {
    setSending(true);
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setSending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Could not send the email. Please try again.");
      return;
    }
    toast.success("Verification link sent — check your inbox (and spam).");
  }

  async function recheck() {
    setChecking(true);
    const supabase = createClient();
    // Force a fresh fetch of the latest user metadata
    await supabase.auth.refreshSession();
    const { data: { user } } = await supabase.auth.getUser();
    setChecking(false);
    if (user?.user_metadata?.app_verified === true) {
      toast.success("Email verified — unlocking everything!");
      router.refresh();
    } else {
      toast.info("Not verified yet. Click the link in your email, then try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <MailWarning className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0f172a]">Verify your email to unlock everything</p>
          <p className="text-sm text-amber-800/80 mt-0.5 leading-relaxed">
            We sent a verification link to <span className="font-semibold">{email}</span>. Until you verify,
            subjects, lessons, practice, mock exams and the AI Tutor stay locked.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            <button
              onClick={resend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#E8722A] hover:bg-[#d4641e] text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Resend email
            </button>
            <button
              onClick={recheck}
              disabled={checking}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-amber-300 bg-white text-amber-700 text-xs font-bold hover:bg-amber-50 transition-all disabled:opacity-60"
            >
              {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              I&apos;ve verified
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
