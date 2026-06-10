"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-10 lg:px-16 bg-[#F8FAFC]">
        <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.05)] px-8 py-10 sm:px-10">

          {/* Logo — always visible on right panel */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.jpeg"
              alt="EduBridge AI"
              width={220}
              height={150}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>

          {/* Heading */}
          <div className="mb-9">
            <p className="text-xs font-semibold tracking-widest text-[#1D4ED8] uppercase mb-2">
              Welcome back
            </p>
            <h1 className="font-display text-[1.75rem] font-bold text-[#0f172a] leading-tight">
              Sign in to your account
            </h1>
            <p className="text-[#64748B] text-sm mt-2">
              Don&apos;t have one?{" "}
              <Link href="/signup" className="text-[#1D4ED8] font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white focus:border-[#1D4ED8] transition-colors rounded-xl text-[#0f172a] placeholder:text-[#94a3b8]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-[#1D4ED8] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white focus:border-[#1D4ED8] transition-colors rounded-xl pr-10 text-[#0f172a] placeholder:text-[#94a3b8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-1 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] active:scale-[0.98] text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-[#94a3b8]">
            For students, teachers, parents &amp; administrators
          </p>
        </div>
      </div>
    </div>
  );
}
