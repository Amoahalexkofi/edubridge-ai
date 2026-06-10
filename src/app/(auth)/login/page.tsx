"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import BrandPanel from "../_components/BrandPanel";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
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
          <div className="lg:hidden">
            <Image
              src="/logo.jpeg"
              alt="EduBridge AI"
              width={140}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
          <div className="hidden lg:block" />
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
