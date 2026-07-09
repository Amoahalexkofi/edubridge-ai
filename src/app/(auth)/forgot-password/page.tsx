"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import BrandPanel from "../_components/BrandPanel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex flex-col min-h-screen bg-white">
        <div className="flex items-center justify-between px-8 sm:px-12 py-5 border-b border-[#EEEDE8]">
          <Link href="/login" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <Link href="/" className="lg:hidden">
            <Image src="/logo-no-bg.png" alt="EduBridge" width={120} height={120} className="h-11 w-auto object-contain" priority />
          </Link>
          <p className="text-sm text-slate-500">
            Remember it?{" "}
            <Link href="/login" className="text-[#1B3A8A] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-14">
          <div className="w-full max-w-[440px] mx-auto">

            {sent ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-green-50 ring-8 ring-green-50/60 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                  We sent a password reset link to{" "}
                  <span className="font-semibold text-slate-800">{email}</span>.
                  {" "}Click it to set a new password.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full h-12 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(232,114,42,0.35)]"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8722A] mb-3">Password reset</p>
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight tracking-tight">Forgot your password?</h1>
                  <p className="text-slate-500 text-sm mt-2.5 leading-relaxed">
                    No worries — enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.35)] text-sm"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="px-8 py-4 border-t border-[#EEEDE8]">
          <p className="text-xs text-slate-400 text-center">© 2026 EduBridge Educational Solutions · Ghana 🇬🇭</p>
        </div>
      </div>
    </div>
  );
}
