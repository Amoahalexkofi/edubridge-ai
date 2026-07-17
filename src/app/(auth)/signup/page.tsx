"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Eye, EyeOff, Loader2, BookOpen, User,
  CheckCircle2, ArrowRight, ArrowLeft, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import BrandPanel from "../_components/BrandPanel";
import { sanitizeNameInput, nameError, sanitizePhoneInput, phoneError, isValidGhanaPhone, isValidName } from "@/lib/validation";

type Role = "student" | "teacher" | "parent";
type ExamTarget = "bece" | "wassce";

const examOptions: { value: ExamTarget; label: string; badge: string; description: string }[] = [
  { value: "bece", label: "BECE", badge: "JHS", description: "Junior High School — Basic Education Certificate Examination" },
  { value: "wassce", label: "WASSCE", badge: "SHS", description: "Senior High School — West African Senior School Certificate" },
];

const roles: { value: Role; label: string; description: string; icon: React.ElementType; color: string; iconBg: string }[] = [
  {
    value: "student",
    label: "Student",
    description: "Prepare for BECE or WASSCE with AI-powered lessons and mock exams",
    icon: BookOpen,
    color: "border-[#1B3A8A] bg-[#EEF2FF]",
    iconBg: "bg-[#1B3A8A]",
  },
  // Teacher accounts are not self-serve — an admin promotes trusted people to
  // teacher (Admin → Users). Keeps content-authoring + billed AI tools gated.
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
  const [examTarget, setExamTarget] = useState<ExamTarget | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [school, setSchool] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [continuing, setContinuing] = useState(false);

  const currentStep = step === "role" ? 1 : step === "details" ? 2 : 3;

  const ROLE_HOME: Record<Role, string> = { student: "/student", teacher: "/teacher", parent: "/parent" };

  // Log the brand-new (still unverified) user straight in and take them to their
  // dashboard. Email verification is enforced as feature gating inside the app.
  async function continueToDashboard() {
    setContinuing(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setContinuing(false);
      toast.error(error.message || "Could not sign you in. Please sign in manually.");
      window.location.href = "/login";
      return;
    }
    // Full-page navigation so the server picks up the new session cookie
    // immediately (a client router.push can render the dashboard before the
    // auth cookie is committed, bouncing the user back to /login).
    window.location.href = ROLE_HOME[selectedRole ?? "student"] ?? "/student";
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const nameErr = nameError(fullName);
    if (nameErr) { toast.error(nameErr); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (selectedRole === "student" && !examTarget) { toast.error("Please select BECE or WASSCE."); return; }
    if (selectedRole === "teacher" && !examTarget) { toast.error("Please select the level you teach (JHS or SHS)."); return; }
    if (selectedRole === "student" && !gradeLevel) { toast.error("Please select your class."); return; }
    if (selectedRole === "student") {
      const perr = phoneError(parentPhone, "parent / guardian phone");
      if (perr) { toast.error(perr); return; }
    }
    if (selectedRole === "parent" && phone.trim()) {
      const perr = phoneError(phone, "mobile number");
      if (perr) { toast.error(perr); return; }
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role: selectedRole,
        examTarget: examTarget ?? null,
        phone: phone || null,
        parentPhone: parentPhone || null,
        school: school || null,
        gradeLevel: gradeLevel || null,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStep("success");
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-5 border-b border-[#EEEDE8]">
          {/* Back to home — desktop */}
          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          {/* Mobile: logo (tappable, goes home) */}
          <Link href="/" className="lg:hidden">
            <Image src="/logo-no-bg.png" alt="EduBridge Educational Solutions" width={120} height={120} className="h-11 w-auto object-contain" priority />
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
                <h2 className="font-[family-name:var(--font-brand)] text-2xl font-extrabold text-slate-900 mb-2">Account created!</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                  We sent a verification link to{" "}
                  <span className="font-semibold text-slate-800">{email}</span>.
                  {" "}Verify it to unlock everything — meanwhile you can get started now.
                </p>
                <button
                  type="button"
                  onClick={continueToDashboard}
                  disabled={continuing}
                  className="inline-flex items-center justify-center gap-2 w-full h-12 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(232,114,42,0.35)] disabled:opacity-60"
                >
                  {continuing ? <><Loader2 className="h-4 w-4 animate-spin" /> Taking you in…</> : <>Continue <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            )}

            {/* ── Role selection ── */}
            {step === "role" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#E8722A] mb-3">
                    Get started — it&apos;s free
                  </p>
                  <h1 className="font-[family-name:var(--font-brand)] text-[2rem] font-extrabold text-slate-900 leading-tight tracking-tight">
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
                          active ? role.color : "border-[#E6E4DE] bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          active ? role.iconBg : "bg-[#F1F0EC]"
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
                  Continue with email <ArrowRight className="h-4 w-4" />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google */}
                <button
                  type="button"
                  disabled={!selectedRole}
                  onClick={async () => {
                    if (!selectedRole) return;
                    const { createClient } = await import("@/lib/supabase/client");
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?role=${selectedRole}`,
                      },
                    });
                  }}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-[#E6E4DE] hover:border-slate-300 hover:bg-[#F8F7F4] rounded-xl transition-all text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                <p className="text-center text-xs text-slate-400">
                  {selectedRole ? `You'll sign up as a ${selectedRole}` : "Select a role above to continue with Google"}
                </p>
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
                  <h1 className="font-[family-name:var(--font-brand)] text-[2rem] font-extrabold text-slate-900 leading-tight tracking-tight">
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
                      onChange={(e) => setFullName(sanitizeNameInput(e.target.value))}
                      autoCapitalize="words"
                      required
                      className="w-full h-12 px-4 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
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
                      className="w-full h-12 px-4 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
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
                        className="w-full h-12 px-4 pr-12 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
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
                            : "border-[#E6E4DE] focus:border-[#1B3A8A] focus:ring-[#1B3A8A]/8"
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

                  {/* BECE / WASSCE — students */}
                  {selectedRole === "student" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Which exam are you preparing for? <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {examOptions.map((opt) => {
                          const active = examTarget === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setExamTarget(opt.value); setGradeLevel(""); }}
                              className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                                active
                                  ? "border-[#1B3A8A] bg-[#EEF2FF]"
                                  : "border-[#E6E4DE] bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-[#1B3A8A] text-white" : "bg-[#F1F0EC] text-slate-600"}`}>
                                  {opt.badge}
                                </span>
                                <span className={`font-bold text-sm ${active ? "text-[#1B3A8A]" : "text-slate-800"}`}>{opt.label}</span>
                              </div>
                              <p className="text-xs text-slate-500 leading-snug">{opt.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* JHS / SHS — teachers */}
                  {selectedRole === "teacher" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Which level do you teach? <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "bece" as ExamTarget, badge: "JHS", label: "Junior High", description: "BECE — Junior High School (JHS 1–3)" },
                          { value: "wassce" as ExamTarget, badge: "SHS", label: "Senior High", description: "WASSCE — Senior High School (SHS 1–3)" },
                        ].map((opt) => {
                          const active = examTarget === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setExamTarget(opt.value)}
                              className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                                active
                                  ? "border-[#E8722A] bg-orange-50"
                                  : "border-[#E6E4DE] bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-[#E8722A] text-white" : "bg-[#F1F0EC] text-slate-600"}`}>
                                  {opt.badge}
                                </span>
                                <span className={`font-bold text-sm ${active ? "text-[#E8722A]" : "text-slate-800"}`}>{opt.label}</span>
                              </div>
                              <p className="text-xs text-slate-500 leading-snug">{opt.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grade / class — students only, appears after exam is chosen */}
                  {selectedRole === "student" && examTarget && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="gradeLevel" className="block text-sm font-semibold text-slate-700">
                          Your class <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="gradeLevel"
                            value={gradeLevel}
                            onChange={(e) => setGradeLevel(e.target.value)}
                            required
                            className="w-full h-12 pl-4 pr-10 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Select class</option>
                            {(examTarget === "bece"
                              ? [{ v: "JHS1", l: "JHS 1" }, { v: "JHS2", l: "JHS 2" }, { v: "JHS3", l: "JHS 3" }]
                              : [{ v: "SHS1", l: "SHS 1 / Form 1" }, { v: "SHS2", l: "SHS 2 / Form 2" }, { v: "SHS3", l: "SHS 3 / Form 3" }]
                            ).map((g) => (
                              <option key={g.v} value={g.v}>{g.l}</option>
                            ))}
                          </select>
                          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="school" className="block text-sm font-semibold text-slate-700">
                          School name <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          id="school"
                          type="text"
                          placeholder="e.g. Accra Academy"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Parent phone — students only */}
                  {selectedRole === "student" && (
                    <div className="space-y-2">
                      <label htmlFor="parentPhone" className="block text-sm font-semibold text-slate-700">
                        Parent / Guardian phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="parentPhone"
                        type="tel"
                        inputMode="tel"
                        placeholder="0244 123 456"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(sanitizePhoneInput(e.target.value))}
                        required
                        className={`w-full h-12 px-4 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 transition-all ${
                          parentPhone.trim() && !isValidGhanaPhone(parentPhone)
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/8"
                            : "border-[#E6E4DE] focus:border-[#1B3A8A] focus:ring-[#1B3A8A]/8"
                        }`}
                      />
                      {parentPhone.trim() && !isValidGhanaPhone(parentPhone) ? (
                        <p className="text-xs text-red-500 font-medium">Enter a valid Ghana number, e.g. 0244 123 456.</p>
                      ) : (
                        <p className="text-xs text-slate-400">When your parent signs up with this number, they&apos;ll be auto-linked to your account.</p>
                      )}
                    </div>
                  )}

                  {/* Own phone — parents only */}
                  {selectedRole === "parent" && (
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                        Your mobile number <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="0244 123 456"
                        value={phone}
                        onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                        className="w-full h-12 px-4 rounded-xl border border-[#E6E4DE] bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#1B3A8A] focus:ring-4 focus:ring-[#1B3A8A]/8 transition-all"
                      />
                      <p className="text-xs text-slate-400">If your child has already registered and entered this number, you&apos;ll be auto-linked.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !isValidName(fullName) ||
                      ((selectedRole === "student" || selectedRole === "teacher") && !examTarget) ||
                      (selectedRole === "student" && (!gradeLevel || !isValidGhanaPhone(parentPhone))) ||
                      (selectedRole === "parent" && phone.trim() !== "" && !isValidGhanaPhone(phone))
                    }
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
        <div className="px-8 py-4 border-t border-[#EEEDE8]">
          <p className="text-xs text-slate-400 text-center">
            © 2026 EduBridge Educational Solutions · Ghana 🇬🇭
          </p>
        </div>
      </div>
    </div>
  );
}
