"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import BrandPanel from "../_components/BrandPanel";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email sent — check your inbox.");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUnverified(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setUnverified(true);
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Login failed."); setLoading(false); return; }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1);

    const role = roles?.[0]?.role ?? "student";
    const redirectMap: Record<string, string> = {
      student: "/student",
      teacher: "/teacher",
      parent: "/parent",
      admin: "/admin",
      super_admin: "/admin",
    };

    router.push(redirectMap[role] ?? "/student");
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      {/* Right panel — full white, no floating card */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 sm:px-12 py-5 border-b border-slate-100">
          {/* Back to home — desktop */}
          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          {/* Mobile: logo (tappable, goes home) */}
          <Link href="/" className="lg:hidden">
            <Image src="/logo-no-bg.png" alt="EduBridge Educational Solutions" width={120} height={120} className="h-11 w-auto object-contain" priority />
          </Link>
          <p className="text-sm text-slate-500">
            New here?{" "}
            <Link href="/signup" className="text-[#1B3A8A] font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-14">
          <div className="w-full max-w-[440px] mx-auto">

            {/* Heading */}
            <div className="mb-10">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8722A] mb-3">
                Welcome back
              </p>
              <h1 className="text-[2rem] font-bold text-slate-900 leading-tight tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-slate-500 text-sm mt-2.5 leading-relaxed">
                Preparing for BECE or WASSCE? Let&apos;s pick up where you left off.
              </p>
            </div>

            {/* Unverified email notice */}
            {unverified && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Email not verified yet</p>
                <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                  We sent a verification link to <span className="font-semibold">{email}</span>. Click it to activate your account, then sign in.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:underline disabled:opacity-60"
                >
                  {resending ? <><Loader2 className="h-3 w-3 animate-spin" /> Sending…</> : "Resend verification email"}
                </button>
              </div>
            )}

            {/* Google */}
            <button
              type="button"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold text-slate-700 shadow-sm"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#1B3A8A] hover:underline font-semibold">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.35)] hover:shadow-[0_6px_20px_rgba(232,114,42,0.4)] text-sm"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                ) : (
                  <>Sign in to EduBridge <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {/* Divider note */}
            <p className="mt-10 text-center text-xs text-slate-400">
              For students, teachers, parents &amp; administrators
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-8 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            © 2026 EduBridge Educational Solutions · Ghana 🇬🇭
          </p>
        </div>
      </div>
    </div>
  );
}
