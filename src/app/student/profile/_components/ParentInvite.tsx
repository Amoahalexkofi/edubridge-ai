"use client";

import { useState } from "react";
import { Share2, Copy, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ParentInvite() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = token ? `${typeof window !== "undefined" ? window.location.origin : "https://edubridgegh.com"}/parent-invite?token=${token}` : null;

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/student/invite", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(data.error ?? "Failed to generate link"); return; }
    setToken(data.token);
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!inviteUrl) return;
    const msg = encodeURIComponent(`Hi! Click this link to link your EduBridge AI account to mine and track my BECE/WASSCE progress:\n\n${inviteUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#0f172a]">Invite your parent</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">Share a link — they tap it and get linked instantly</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
          <Share2 className="h-5 w-5 text-green-600" />
        </div>
      </div>

      {!token ? (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#1B3A8A] hover:bg-[#1e40af] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : "Generate invite link"}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Token display */}
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-0.5">Invite code</p>
              <p className="font-mono font-black text-[#1B3A8A] text-lg tracking-[0.2em]">{token}</p>
            </div>
            <button
              onClick={copyLink}
              className="h-9 w-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-slate-50 transition-all flex-shrink-0"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={shareWhatsApp}
            className="w-full h-11 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl text-sm transition-all"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </button>

          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
            <button
              onClick={generate}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" /> New link
            </button>
          </div>

          <p className="text-xs text-[#94a3b8] text-center">Link expires in 7 days · Generates a new code anytime</p>
        </div>
      )}
    </div>
  );
}
