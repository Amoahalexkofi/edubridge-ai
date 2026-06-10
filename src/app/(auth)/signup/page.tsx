"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye, EyeOff, Loader2, BookOpen, Users, User,
  CheckCircle2, ArrowRight, ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import BrandPanel from "../_components/BrandPanel";

type Role = "student" | "teacher" | "parent";

const roles: { value: Role; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "student",
    label: "Student",
    description: "Prepare for BECE or WASSCE exams",
    icon: BookOpen,
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Upload lessons and track class progress",
    icon: Users,
  },
  {
    value: "parent",
    label: "Parent",
    description: "Monitor your child's learning journey",
    icon: User,
  },
];

export default function SignupPage() {
  const [step, setStep] = useState<"role" | "details" | "success">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: selectedRole } },
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }
    setStep("success");
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-10 lg:px-16 bg-[#F8FAFC]">
        <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.05)] px-8 py-10 sm:px-10">

          {/* Logo */}
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

          {/* ── Step: success ── */}
          {step === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 rounded-full bg-[#22C55E]/10 ring-8 ring-[#22C55E]/5 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-2">
                Account created!
              </h2>
              <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
                We sent a verification link to{" "}
                <span className="font-semibold text-[#0f172a]">{email}</span>.
                {" "}Open it to activate your account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-11 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Go to sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* ── Step: role selection ── */}
          {step === "role" && (
            <>
              <div className="mb-8">
                <p className="text-xs font-semibold tracking-widest text-[#1D4ED8] uppercase mb-2">
                  Get started
                </p>
                <h1 className="font-display text-[1.75rem] font-bold text-[#0f172a] leading-tight">
                  Who are you?
                </h1>
                <p className="text-[#64748B] text-sm mt-2">
                  Pick your role so we can personalise your experience.
                </p>
              </div>

              <div className="space-y-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        active
                          ? "border-[#1D4ED8] bg-[#EFF6FF]"
                          : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#93C5FD] hover:bg-white"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? "bg-[#1D4ED8]" : "bg-white border border-[#E2E8F0]"
                      }`}>
                        <Icon className={`h-[18px] w-[18px] ${active ? "text-white" : "text-[#64748B]"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${active ? "text-[#1D4ED8]" : "text-[#0f172a]"}`}>
                          {role.label}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">{role.description}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 transition-all ${
                        active ? "border-[#1D4ED8] bg-[#1D4ED8]" : "border-[#CBD5E1]"
                      }`}>
                        {active && <CheckCircle2 className="h-full w-full text-white p-0.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => selectedRole && setStep("details")}
                disabled={!selectedRole}
                className="w-full h-11 mt-6 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] active:scale-[0.98] text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-[#64748B] mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1D4ED8] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step: details form ── */}
          {step === "details" && (
            <>
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0f172a] mb-4 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold tracking-widest text-[#1D4ED8] uppercase">
                    {selectedRole}
                  </p>
                </div>
                <h1 className="font-display text-[1.75rem] font-bold text-[#0f172a] leading-tight">
                  Create your account
                </h1>
                <p className="text-[#64748B] text-sm mt-2">Fill in your details below to get started.</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Kofi Mensah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white focus:border-[#1D4ED8] transition-colors rounded-xl text-[#0f172a] placeholder:text-[#94a3b8]"
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white focus:border-[#1D4ED8] transition-colors rounded-xl pr-9 text-[#0f172a] placeholder:text-[#94a3b8]"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm" className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
                      Confirm
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white transition-colors rounded-xl pr-9 text-[#0f172a] placeholder:text-[#94a3b8] ${
                          confirmPassword && confirmPassword !== password
                            ? "border-[#EF4444] focus:border-[#EF4444]"
                            : "focus:border-[#1D4ED8]"
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[10px] text-[#EF4444] font-medium">Passwords don&apos;t match</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] active:scale-[0.98] text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                  ) : (
                    <>Create account <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-[#64748B] mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1D4ED8] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
