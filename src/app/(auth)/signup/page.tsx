"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye, EyeOff, Loader2, BookOpen, Users, User,
  CheckCircle2, ArrowRight, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import BrandPanel from "../_components/BrandPanel";

type Role = "student" | "teacher" | "parent";

const roles: { value: Role; label: string; description: string; icon: React.ElementType; color: string; iconBg: string }[] = [
  {
    value: "student",
    label: "Student",
    description: "Prepare for BECE or WASSCE with AI-powered lessons and mock exams",
    icon: BookOpen,
    color: "border-[#1B3A8A] bg-[#EEF2FF]",
    iconBg: "bg-[#1B3A8A]",
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Upload lessons, create assessments and track class progress",
    icon: Users,
    color: "border-[#E8722A] bg-orange-50",
    iconBg: "bg-[#E8722A]",
  },
  {
    value: "parent",
    label: "Parent / Guardian",
    description: "Monitor your child's learning journey and exam readiness",
    icon: User,
    color: "border-green-600 bg-green-50",
    iconBg: "bg-green-600",
  },
];

const steps = [
  { number: 1, label: "Your role" },
  { number: 2, label: "Your details" },
  { number: 3, label: "Done" },
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

  const currentStep = step === "role" ? 1 : step === "details" ? 2 : 3;

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

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 sm:px-12 py-5 border-b border-slate-100">
          {/* Back to home — desktop */}
          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          {/* Mobile: logo (tappable, goes home) */}
          <Link href="/" className="lg:hidden">
            <Image
              src="/logo.jpeg"
              alt="EduBridge AI"
              width={140}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1B3A8A] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-14">
          <div className="w-full max-w-[480px] mx-auto">

            {/* ── Step progress ── */}
            {step !== "success" && (
              <div className="flex items-center gap-2 mb-10">
                {steps.map((s, i) => (
                  <div key={s.number} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 ${currentStep >= s.number ? "opacity-100" : "opacity-30"}`}>
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        currentStep > s.number
                          ? "bg-[#1B3A8A] text-white"
                          : currentStep === s.number
                          ? "bg-[#E8722A] text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        {currentStep > s.number ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:block ${
                        currentStep === s.number ? "text-slate-900" : "text-slate-400"
                      }`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`h-px w-6 sm:w-10 transition-colors ${currentStep > s.number ? "bg-[#1B3A8A]" : "bg-slate-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Success ── */}
            {step === "success" && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-green-50 ring-8 ring-green-50/60 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Account created!</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                  We sent a verification link to{" "}
                  <span className="font-semibold text-slate-800">{email}</span>.
                  {" "}Open it to activate your account and start learning.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full h-12 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(232,114,42,0.35)]"
                >
                  Go to sign in <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* ── Role selection ── */}
            {step === "role" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8722A] mb-3">
                    Get started — it&apos;s free
                  </p>
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight tracking-tight">
                    Who are you?
                  </h1>
                  <p className="text-slate-500 text-sm mt-2.5">
                    Pick your role so we can personalise your experience.
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const active = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm ${
                          active ? role.color : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          active ? role.iconBg : "bg-slate-100"
                        }`}>
                          <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${active ? "text-slate-900" : "text-slate-800"}`}>
                            {role.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{role.description}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 transition-all ${
                          active
                            ? "border-[#1B3A8A] bg-[#1B3A8A]"
                            : "border-slate-300"
                        }`}>
                          {active && <div className="h-full w-full rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => selectedRole && setStep("details")}
                  disabled={!selectedRole}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.3)] hover:shadow-[0_6px_20px_rgba(232,114,42,0.38)] text-sm"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* ── Details form ── */}
            {step === "details" && (
              <>
                <div className="mb-8">
                  <button
                    type="button"
                    onClick={() => setStep("role")}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-5 transition-colors font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8722A] mb-3">
                    Signing up as a {selectedRole}
                  </p>
                  <h1 className="text-[2rem] font-bold text-slate-900 leading-tight tracking-tight">
                    Create your account
                  </h1>
                  <p className="text-slate-500 text-sm mt-2.5">Fill in your details below to get started.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Kofi Mensah"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                    />
                  </div>

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

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full h-12 px-4 pr-12 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 transition-all ${
                          confirmPassword && confirmPassword !== password
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/8"
                            : "border-slate-200 focus:border-[#1B3A8A] focus:ring-[#1B3A8A]/8"
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-red-500 font-medium">Passwords don&apos;t match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(232,114,42,0.35)] hover:shadow-[0_6px_20px_rgba(232,114,42,0.4)] text-sm mt-2"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Creating your account…</>
                    ) : (
                      <>Create my free account <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </form>
              </>
            )}

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
