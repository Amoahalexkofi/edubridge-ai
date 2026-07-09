"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Brain, Clock, BookOpen, BarChart2, Zap, Shield,
  GraduationCap, BookMarked, Users, ShieldCheck,
  Menu, X, ArrowRight, CheckCircle2, Flame, Trophy,
  Award, Star, PlayCircle, ClipboardCheck, TrendingUp,
  ChevronRight, FileText, BadgeCheck,
} from "lucide-react";

const navLinks = [
  { label: "Features",     href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Subjects",     href: "#curriculum" },
  { label: "For everyone", href: "#for-everyone" },
];

const stats = [
  { end: 22,  suffix: "",   label: "BECE & WASSCE subjects covered",   tag: "Full coverage",  icon: BookOpen,   iconBg: "from-[#0D9488] to-[#0f766e]", glow: "rgba(13,148,136,0.15)" },
  { end: 10,  suffix: "k+", label: "WAEC-style practice questions",    tag: "Question bank",  icon: FileText,   iconBg: "from-[#E8722A] to-[#d4641e]", glow: "rgba(232,114,42,0.15)" },
  { end: 24,  suffix: "/7", label: "AI tutor always available",        tag: "Never offline",  icon: Brain,      iconBg: "from-[#6366f1] to-[#4f46e5]", glow: "rgba(99,102,241,0.15)" },
  { end: 100, suffix: "%",  label: "GES curriculum aligned",           tag: "Exam-ready",     icon: BadgeCheck, iconBg: "from-[#1A6B3C] to-[#15803d]", glow: "rgba(26,107,60,0.15)" },
];

// Top tier — large, prominent cards
const featuresTop = [
  {
    icon: Brain,
    title: "AI Tutor",
    desc: "Explains any concept in plain English or Twi, generates examples and quizzes on demand — available around the clock.",
    color: "from-[#0D9488] to-[#0f766e]",
    featured: false,
    highlight: true, // gets special treatment
  },
  {
    icon: Clock,
    title: "Mock Exam Engine",
    desc: "Timed, randomised WAEC-style papers with auto-save, question flagging and instant detailed marking.",
    color: "from-[#1B3A8A] to-[#1e40af]",
    featured: false,
    highlight: false,
  },
  {
    icon: BookOpen,
    title: "Curriculum Lessons",
    desc: "Video, text and interactive activities mapped exactly to GES topics and WAEC blueprints.",
    color: "from-[#E8722A] to-[#d4641e]",
    featured: true, // dark card
    highlight: false,
  },
];

// Bottom tier — compact, supporting cards
const featuresBottom = [
  { icon: BarChart2, title: "Real-time Analytics", desc: "Topic mastery, exam readiness and grade projections for students, teachers and parents.", color: "from-[#1A6B3C] to-[#15803d]" },
  { icon: Zap,       title: "Adaptive Remediation", desc: "After every assessment, a personalised revision plan and follow-up practice targets your weak spots.", color: "from-[#D97706] to-[#b45309]" },
  { icon: Shield,    title: "Secure & Private",      desc: "Role-based access, encrypted data at rest and in transit — examination-grade integrity guaranteed.", color: "from-[#6366f1] to-[#4f46e5]" },
];

const steps = [
  { number: "01", icon: PlayCircle,    title: "Sign up & pick your exam",         desc: "Choose BECE or WASSCE, select your subjects, and get a personalised study plan ready in minutes.",                         img: "/images/student-laptop.jpg", accent: "#0D9488" },
  { number: "02", icon: BookOpen,      title: "Learn with AI-powered lessons",    desc: "Work through curriculum-aligned lessons, ask the AI tutor anything, and practice with topic quizzes as you go.",          img: "/images/student-exam.jpg",   accent: "#E8722A" },
  { number: "03", icon: ClipboardCheck,title: "Sit mock exams & track progress",  desc: "Take timed WAEC-style mock papers, get instant results, and watch your readiness score climb.",                          img: "/images/classroom.jpg",      accent: "#1A6B3C" },
];

const roles = [
  { icon: GraduationCap, title: "Students",       desc: "Personalised learning paths, daily goals, streaks and an AI tutor that never sleeps.",                         iconBg: "bg-[#EEF2FF]",  iconColor: "text-[#1B3A8A]",  border: "hover:border-[#1B3A8A]/30" },
  { icon: BookMarked,    title: "Teachers",        desc: "Author lessons, create questions, monitor every learner and spot who needs help early.",                       iconBg: "bg-[#FFF7ED]",  iconColor: "text-[#E8722A]",  border: "hover:border-[#E8722A]/30" },
  { icon: Users,         title: "Parents",         desc: "Read-only view of your child's progress, attendance, quiz scores and exam readiness.",                        iconBg: "bg-[#F0FDF4]",  iconColor: "text-[#1A6B3C]",  border: "hover:border-[#1A6B3C]/30" },
  { icon: ShieldCheck,   title: "Administrators",  desc: "User management, content approval, platform analytics and school-wide reporting.",                           iconBg: "bg-[#F0FDFA]",  iconColor: "text-[#0D9488]",  border: "hover:border-[#0D9488]/30" },
];

const beceSubjects    = ["Career Technology","Computing","Creative Arts","English Language","French","Ghanaian Language","Integrated Science","Mathematics","Religious & Moral Education","Social Studies"];
const wassceSubjects  = ["Biology","Chemistry","Core English","Core Mathematics","Economics","Elective Mathematics","Geography","Government","Integrated Science","Literature in English","Physics","Social Studies"];

const badges     = [{ icon: Flame, label: "7-day streak", bg: "bg-orange-50", color: "text-orange-500" },{ icon: Trophy, label: "Mock exam ace", bg: "bg-yellow-50", color: "text-yellow-600" },{ icon: Award, label: "Topic master", bg: "bg-teal-50", color: "text-teal-600" },{ icon: Star, label: "Class champion", bg: "bg-purple-50", color: "text-purple-500" }];
const leaderboard = [{ name: "Akosua M.", xp: "4,820 XP", rank: 1 },{ name: "Kwame O.", xp: "4,510 XP", rank: 2 },{ name: "Yaa A.", xp: "4,270 XP", rank: 3 }];
const weekDays   = ["M","T","W","T","F","S","S"];
const activeDays = [0,1,2,3,4];

function StatNumber({ end, suffix, started, duration = 2200 }: { end: number; suffix: string; started: boolean; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    setCount(0);
    let raf: number;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);
  return <>{count}{suffix}</>;
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const statsRef                    = useRef<HTMLElement>(null);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const el = statsRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsStarted(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-white min-h-screen antialiased">

      {/* ─── NAV ───────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_-14px_rgba(27,58,138,0.30)]"
          : "bg-white"
      }`}>
        <div className="h-[3px] bg-gradient-to-r from-[#1B3A8A] via-[#0D9488] to-[#E8722A]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            <Link href="/" className="shrink-0">
              <Image src="/logo-no-bg.png" alt="EduBridge Educational Solutions" width={180} height={180} className="h-10 w-auto object-contain" priority />
            </Link>

            {/* Floating-pill nav — one calm hover affordance */}
            <nav className="hidden md:flex items-center gap-0.5 rounded-full border border-[#E6E4DE]/80 bg-[#F8F7F4]/70 p-1">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href} className="px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1B3A8A] rounded-full hover:bg-white hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200">
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-1.5">
              <Link href="/login" className="inline-flex items-center h-10 px-4 text-sm font-semibold text-[#1B3A8A] rounded-xl hover:bg-[#EEF2FF] transition-colors">Sign in</Link>
              <Link href="/signup" className="inline-flex items-center gap-1.5 h-10 px-5 bg-[#E8722A] hover:bg-[#d4641e] text-white text-sm font-bold rounded-xl transition-all shadow-[0_2px_10px_rgba(232,114,42,0.35)] hover:shadow-[0_6px_18px_rgba(232,114,42,0.45)] hover:-translate-y-px">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button className="md:hidden p-2 rounded-xl hover:bg-[#F1F0EC] transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-[#EEEDE8] bg-white px-5 py-4 space-y-1">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="flex items-center justify-between text-sm font-medium text-slate-700 py-2.5 px-3 rounded-lg hover:bg-[#F0F4FF] hover:text-[#1B3A8A] transition-colors" onClick={() => setMobileOpen(false)}>
                {l.label} <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            ))}
            <div className="flex gap-3 pt-3 mt-1 border-t border-[#EEEDE8]">
              <Link href="/login"  className="flex-1 text-center py-3 border-2 border-[#1B3A8A] text-[#1B3A8A] text-sm font-bold rounded-xl">Sign in</Link>
              <Link href="/signup" className="flex-1 text-center py-3 bg-[#E8722A] text-white text-sm font-bold rounded-xl">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#F0F4FF]">
        <div className="absolute inset-0" style={{ background: "radial-gradient(90% 75% at 80% 8%, rgba(29,78,216,0.12) 0%, rgba(29,78,216,0) 55%), radial-gradient(75% 70% at 8% 30%, rgba(13,148,136,0.09) 0%, rgba(13,148,136,0) 55%), linear-gradient(180deg, #E9EFFF 0%, #F2F6FF 42%, #FFFFFF 100%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-0 lg:pt-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-end">

            {/* Left */}
            <div className="pb-14 lg:pb-20">
              <div className="eb-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1B3A8A]/20 bg-white text-sm text-[#1B3A8A] font-semibold mb-8 shadow-sm">
                <span>🇬🇭</span> Built for Ghana&apos;s BECE &amp; WASSCE candidates
              </div>

              <h1 className="eb-rise-2 font-[family-name:var(--font-brand)] font-extrabold tracking-[-0.035em] leading-[0.98] mb-6 text-[clamp(2.75rem,6vw,4.25rem)] text-balance">
                <span className="block text-slate-900">Smart learning.</span>
                <span className="block text-[#1B3A8A]">Smarter assessment.</span>
                <span className="block text-[#E8722A]">Better outcomes.</span>
              </h1>

              <p className="eb-rise-3 text-slate-600 text-[17px] leading-relaxed mb-9 max-w-[460px]">
                EduBridge AI prepares students for WAEC examinations with curriculum-aligned lessons,
                adaptive mock exams, an always-on AI tutor and real-time analytics for teachers and parents.
              </p>

              <div className="eb-rise-3 flex flex-wrap gap-3 mb-9">
                <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all shadow-[0_4px_16px_rgba(232,114,42,0.4)] hover:shadow-[0_8px_28px_rgba(232,114,42,0.5)] hover:-translate-y-0.5 text-sm">
                  Start learning free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-[#1B3A8A] text-[#1B3A8A] font-bold rounded-xl transition-all hover:bg-[#1B3A8A] hover:text-white text-sm hover:-translate-y-0.5">
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-5">
                {["GES & WAEC aligned", "Works on low bandwidth", "Free for students"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-[#1A6B3C] flex-shrink-0" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — image + 2 refined floating cards */}
            <div className="relative hidden lg:block">
              {/* Image with subtle frame */}
              <div className="relative rounded-t-[2rem] overflow-hidden h-[520px] shadow-[0_32px_64px_rgba(27,58,138,0.18)]">
                <Image src="/images/heroimage.jpg" alt="Students learning with EduBridge AI" fill className="object-cover object-center" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F0F4FF] via-transparent to-[#1B3A8A]/8" />
              </div>

              {/* Card 1 — AI Tutor (top left, refined) */}
              <div className="absolute top-6 -left-8 w-[220px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.14)] border border-[#EEEDE8]/80 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-[#0D9488] to-[#0f766e]" />
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-3.5 w-3.5 text-[#0D9488]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">AI Tutor</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1A6B3C]" />
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Online now</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F8F7F4] rounded-xl p-2.5 border border-[#EEEDE8]">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">&ldquo;Explain quadratic equations in simple terms&rdquo;</p>
                    <div className="flex gap-1 mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488] animate-pulse" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488] animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488] animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 — Score (right, refined) */}
              <div className="absolute top-44 -right-6 w-[160px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.14)] border border-[#EEEDE8]/80 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-[#1B3A8A] to-[#1e40af]" />
                <div className="p-4">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mock Exam</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[2.4rem] font-black text-[#1B3A8A] leading-none tabular-nums">87</span>
                    <span className="text-sm font-bold text-[#1B3A8A]/40">%</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1.5 bg-[#F1F0EC] rounded-full mt-2 mb-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1B3A8A] to-[#0D9488] rounded-full" style={{ width: "87%" }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-[#1A6B3C]" />
                    <span className="text-[10px] text-[#1A6B3C] font-bold">+12% this week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-[#1B3A8A] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(125% 125% at 88% 6%, rgba(37,99,235,0.55) 0%, rgba(37,99,235,0) 52%), radial-gradient(120% 120% at 6% 100%, rgba(13,148,136,0.38) 0%, rgba(13,148,136,0) 55%), linear-gradient(157deg, #14306d 0%, #1b3a8a 52%, #15336f 100%)" }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-20 items-center">

            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8722A]/15 border border-[#E8722A]/25 mb-7">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8722A]" />
                <span className="text-[11px] font-bold text-[#E8722A]/80 uppercase tracking-[0.16em]">Trusted platform</span>
              </div>
              <h2 className="font-[family-name:var(--font-brand)] text-3xl lg:text-[2.6rem] text-white leading-[1.15] mb-5">
                The numbers<br />tell the story.
              </h2>
              <p className="text-white/75 text-[15px] leading-relaxed max-w-[260px]">
                Built for depth, scale and accessibility — from JHS to SHS, every subject, every student in Ghana.
              </p>
              <div className="mt-10 flex items-center gap-3">
                <div className="h-px w-16 bg-gradient-to-r from-[#E8722A]/60 to-transparent" />
                <span className="text-[11px] font-semibold text-white/55 uppercase tracking-[0.15em]">Ghana · Since 2024</span>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 gap-px bg-white/[0.08] rounded-2xl overflow-hidden ring-1 ring-white/[0.08]">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="relative bg-[#1a3985] hover:bg-[#1d3f95] transition-colors duration-300 p-5 sm:p-8 lg:p-10 group">
                    <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl" style={{ background: s.glow }} />
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.iconBg} flex items-center justify-center mb-4 sm:mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.3)]`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] font-black text-[#E8722A] tracking-tight leading-none tabular-nums">
                      <StatNumber end={s.end} suffix={s.suffix} started={statsStarted} />
                    </p>
                    <p className="text-[13px] text-white/70 font-medium leading-snug mt-3">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Simple to start</p>
            <h2 className="font-[family-name:var(--font-brand)] text-4xl lg:text-5xl text-slate-900 leading-tight max-w-xl mx-auto">
              From sign-up to exam-ready in three steps.
            </h2>
          </div>

          {/* Steps with connecting line on desktop */}
          <div className="relative grid md:grid-cols-3 gap-5 lg:gap-6">
            {/* Connector line */}
            <div className="hidden md:block absolute top-[108px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-[#0D9488] via-[#E8722A] to-[#1A6B3C] opacity-30" />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="group relative bg-white rounded-3xl overflow-hidden border border-[#EEEDE8] hover:border-[#E6E4DE] hover:shadow-xl transition-all duration-300">
                  <div className="relative h-52 overflow-hidden">
                    <Image src={step.img} alt={step.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    {/* Step number — large background text */}
                    <div className="absolute top-3 right-4">
                      <span className="text-[5rem] font-[family-name:var(--font-brand)] font-black text-white/10 leading-none select-none">{step.number}</span>
                    </div>
                    {/* Icon badge at bottom */}
                    <div className="absolute bottom-4 left-4">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: step.accent }}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="w-6 h-0.5 rounded-full mb-4" style={{ backgroundColor: step.accent }} />
                    <h3 className="font-bold text-slate-900 text-[17px] mb-2 leading-snug">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#F8F9FF] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Why EduBridge AI</p>
              <h2 className="font-[family-name:var(--font-brand)] text-4xl lg:text-5xl text-slate-900 leading-tight max-w-xl">
                Everything a candidate needs in one beautiful place.
              </h2>
            </div>
            <Link href="/signup" className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#1B3A8A] text-[#1B3A8A] font-bold text-sm hover:bg-[#1B3A8A] hover:text-white transition-all flex-shrink-0">
              Explore all features <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* ── Top tier: 3 large cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {featuresTop.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className={`rounded-2xl p-7 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                    f.featured ? "bg-[#1B3A8A] border-[#1B3A8A]" : "bg-white border-[#E6E4DE] hover:border-slate-300"
                  }`}>
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.12)]`}>
                    <Icon className="h-5.5 w-5.5 text-white" />
                  </div>
                  <h3 className={`font-bold text-lg mb-2.5 ${f.featured ? "text-white" : "text-slate-900"}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed ${f.featured ? "text-white/75" : "text-slate-600"}`}>{f.desc}</p>

                  {/* AI Tutor gets a subtle extra element */}
                  {f.highlight && (
                    <div className="mt-5 flex items-center gap-2 p-3 bg-[#F0FDFA] rounded-xl border border-[#0D9488]/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488] flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-[#0D9488]">Supports English &amp; Twi</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Bottom tier: 3 compact cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuresBottom.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className="bg-white rounded-2xl p-5 border border-[#E6E4DE] hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-4">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[15px] mb-1">{f.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── GAMIFICATION ──────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28 border-t border-[#EEEDE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Learn. Earn. Level up.</p>
              <h2 className="font-[family-name:var(--font-brand)] text-4xl lg:text-5xl text-slate-900 mb-5 leading-tight">
                Studying that feels like leveling up your favourite game.
              </h2>
              <p className="text-slate-600 text-[17px] mb-8 leading-relaxed max-w-md">
                Earn XP for every lesson and quiz, keep your daily streak alive, unlock badges and climb the school leaderboard.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1B3A8A] hover:bg-[#162f74] text-white font-bold rounded-xl transition-all text-sm shadow-[0_4px_16px_rgba(27,58,138,0.3)] hover:-translate-y-0.5">
                Start earning XP <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {/* Streak card */}
              <div className="relative overflow-hidden bg-[#1B3A8A] rounded-2xl p-6 text-white shadow-[0_8px_32px_rgba(27,58,138,0.2)]">
                <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-[#0D9488]/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-4 w-4 text-[#E8722A]" />
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Daily streak</span>
                  </div>
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-[family-name:var(--font-brand)] text-6xl font-black leading-none">12</span>
                      <span className="text-lg text-white/60 mb-1">days</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Level 8 · Scholar</p>
                      <p className="text-sm font-bold text-[#E8722A]">4,385 / 5,000 XP</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E8722A] to-[#f97316] rounded-full" style={{ width: "87.7%" }} />
                  </div>
                  <div className="flex gap-1.5">
                    {weekDays.map((d, i) => (
                      <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeDays.includes(i) ? "bg-[#E8722A] text-white" : "bg-white/8 text-white/25"}`}>{d}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badges + Leaderboard side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#EEEDE8]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-sm">Badges to unlock</h3>
                    <span className="text-[10px] text-slate-400 font-medium">8 of 32</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {badges.map((b) => { const BIcon = b.icon; return (
                      <div key={b.label} className={`${b.bg} rounded-xl p-2.5 flex flex-col items-center gap-1.5 border border-white`}>
                        <BIcon className={`h-4.5 w-4.5 ${b.color}`} />
                        <span className="text-[9px] font-semibold text-slate-600 text-center leading-tight">{b.label}</span>
                      </div>
                    ); })}
                  </div>
                </div>
                <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#EEEDE8]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      <h3 className="font-bold text-slate-800 text-sm">Leaderboard</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">This week</span>
                  </div>
                  <div className="space-y-2.5">
                    {leaderboard.map((l) => (
                      <div key={l.name} className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#1B3A8A] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{l.rank}</div>
                        <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{l.name}</span>
                        <span className="text-[10px] font-bold text-[#E8722A]">{l.xp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR EVERYONE ──────────────────────────────────────────────── */}
      <section id="for-everyone" className="bg-[#F8F9FF] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative rounded-3xl overflow-hidden h-80 lg:h-[500px] hidden lg:block shadow-2xl">
              <Image src="/images/teacher.jpg" alt="Teacher with students" fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A8A]/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <p className="font-bold text-slate-800 text-sm mb-1">Every role. One platform.</p>
                <p className="text-xs text-slate-500">Students, teachers, parents and admins — all connected in real time.</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Built for everyone</p>
              <h2 className="font-[family-name:var(--font-brand)] text-4xl lg:text-5xl text-slate-900 mb-10 leading-tight">
                One platform, four tailored experiences.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((r) => { const Icon = r.icon; return (
                  <div key={r.title} className={`bg-white rounded-2xl p-5 border border-[#EEEDE8] ${r.border} hover:shadow-md transition-all duration-200`}>
                    <div className={`h-10 w-10 rounded-xl ${r.iconBg} flex items-center justify-center mb-3.5`}><Icon className={`h-5 w-5 ${r.iconColor}`} /></div>
                    <h3 className="font-bold text-slate-900 mb-1.5">{r.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
                  </div>
                ); })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CURRICULUM ────────────────────────────────────────────────── */}
      <section id="curriculum" className="bg-white border-y border-[#EEEDE8] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Curriculum</p>
              <h2 className="font-[family-name:var(--font-brand)] text-4xl lg:text-5xl text-slate-900 mb-5 leading-tight">BECE and WASSCE subjects, every one of them.</h2>
              <p className="text-slate-600 text-[17px] leading-relaxed mb-8">Tap any subject to jump straight into its topics, lessons and practice questions.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1B3A8A] hover:bg-[#162f74] text-white font-bold rounded-xl transition-all text-sm shadow-[0_4px_16px_rgba(27,58,138,0.25)] hover:-translate-y-0.5">
                Browse all subjects <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">BECE · Junior High</p>
                <div className="flex flex-wrap gap-2">
                  {beceSubjects.map((s) => (
                    <Link key={s} href="/signup" className="px-3.5 py-1.5 rounded-full border border-[#E6E4DE] bg-[#F8F7F4] hover:border-[#1B3A8A] hover:bg-[#F0F4FF] hover:text-[#1B3A8A] text-sm text-slate-700 font-medium transition-all">{s}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">WASSCE · Senior High</p>
                <div className="flex flex-wrap gap-2">
                  {wassceSubjects.map((s) => (
                    <Link key={s} href="/signup" className="px-3.5 py-1.5 rounded-full border border-[#E6E4DE] bg-[#F8F7F4] hover:border-[#E8722A] hover:bg-orange-50 hover:text-[#E8722A] text-sm text-slate-700 font-medium transition-all">{s}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUOTE ─────────────────────────────────────────────────────── */}
      <section className="relative h-72 lg:h-96 overflow-hidden">
        <Image src="/images/students-classroom-gh.jpg" alt="Ghanaian students in the classroom" fill className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A8A]/88 via-[#1B3A8A]/72 to-[#0D9488]/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <p className="font-[family-name:var(--font-brand)] text-3xl lg:text-5xl text-white font-bold max-w-3xl leading-tight mb-4">
            &ldquo;Every Ghanaian student deserves a world-class education.&rdquo;
          </p>
          <p className="text-white/75 text-sm font-medium">— EduBridge AI Mission</p>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FF] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-[#1B3A8A] rounded-3xl shadow-[0_24px_64px_rgba(27,58,138,0.3)]">
            <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-[#E8722A]/20 -translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-[#0D9488]/15 translate-y-1/2 blur-xl" />
            <div className="grid lg:grid-cols-2 gap-0 items-stretch">
              <div className="px-8 py-16 sm:px-14 lg:px-16 relative z-10">
                <h2 className="font-[family-name:var(--font-brand)] text-4xl lg:text-5xl text-white mb-4 leading-tight">Your best result is one practice away.</h2>
                <p className="text-white/80 text-lg mb-8">Join EduBridge AI today. Free for students, always.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(232,114,42,0.5)] hover:-translate-y-0.5 text-sm">
                    Create my free account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm border border-white/20 hover:-translate-y-0.5">
                    Sign in to dashboard
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block min-h-[340px]">
                <Image src="/images/students-shs-uniforms.jpg" alt="EduBridge students in school uniforms" fill className="object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1B3A8A]/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="h-[3px] bg-gradient-to-r from-[#1B3A8A] via-[#0D9488] to-[#E8722A]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Image src="/logo-no-bg.png" alt="EduBridge Educational Solutions" width={130} height={130} className="h-16 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">Ghana&apos;s most advanced BECE and WASSCE exam preparation platform. Curriculum-aligned, AI-powered, free for students.</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="h-2 w-2 rounded-full bg-[#1A6B3C] shadow-[0_0_6px_rgba(26,107,60,0.6)]" />
                <span className="text-xs text-slate-500 font-medium">All systems operational</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Platform</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#features"    className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#curriculum"  className="hover:text-white transition-colors">Subjects</a></li>
                <li><a href="#how-it-works"className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#for-everyone"className="hover:text-white transition-colors">For everyone</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Get started</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/signup" className="hover:text-white transition-colors">Create account</Link></li>
                <li><Link href="/login"  className="hover:text-white transition-colors">Sign in</Link></li>
                <li><a href="#"          className="hover:text-white transition-colors">For schools</a></li>
                <li><a href="#"          className="hover:text-white transition-colors">Contact us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-400">© 2026 EduBridge Educational Solutions. Made for Ghana 🇬🇭</p>
            <p className="text-sm text-slate-500">Smart Learning. Smarter Assessment. Better Outcomes.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
