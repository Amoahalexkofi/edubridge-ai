"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandPanel from "../_components/BrandPanel";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
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
          <span />
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-14">
          <div className="w-full max-w-[440px] mx-auto">

            {done ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-green-50 ring-8 ring-green-50/60 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Password updated!</h2>
                <p className="text-slate-500 text-sm leading-relaxed">Redirecting you to sign in…</p>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8722A] mb-3">New password</p>
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight tracking-tight">Set a new password</h1>
                  <p className="text-slate-500 text-sm mt-2.5">Must be at least 8 characters.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">New password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full h-12 px-4 pr-12 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700">Confirm password</label>
                    <input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className={`w-full h-12 px-4 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 transition-all ${
                        confirm && confirm !== password
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400/8"
                          : "border-[#E6E4DE] focus:border-[#1B3A8A] focus:ring-[#1B3A8A]/8"
                      }`}
                    />
                    {confirm && confirm !== password && (
                      <p className="text-xs text-red-500 font-medium">Passwords don&apos;t match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.35)] text-sm mt-2"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
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
