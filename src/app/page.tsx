"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Lora } from "next/font/google";
import {
  Brain, Clock, BookOpen, BarChart2, Zap, Shield,
  GraduationCap, BookMarked, Users, ShieldCheck,
  Menu, X, ArrowRight, CheckCircle2, Flame, Trophy,
  Award, Star, PlayCircle, ClipboardCheck, TrendingUp,
  ChevronRight,
} from "lucide-react";

const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

// ─── Brand colors from logo ────────────────────────────────────────────
// Primary: Deep Blue  #1B3A8A  (EDUBRIDGE text)
// Accent:  Orange     #E8722A  (YOUTH ACADEMY text)
// Support: Green      #1A6B3C  (Ghana arc)
// ──────────────────────────────────────────────────────────────────────

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Subjects", href: "#curriculum" },
  { label: "For everyone", href: "#for-everyone" },
];

const stats = [
  { end: 22,  suffix: "",   label: "BECE & WASSCE subjects" },
  { end: 10,  suffix: "k+", label: "WAEC-style questions" },
  { end: 24,  suffix: "/7", label: "AI tutor availability" },
  { end: 100, suffix: "%",  label: "GES curriculum aligned" },
];

const features = [
  {
    icon: Brain,
    title: "AI Tutor",
    desc: "Explains any concept in plain English or Twi, generates examples and quizzes on demand — available around the clock.",
    accent: false,
  },
  {
    icon: Clock,
    title: "Mock Exam Engine",
    desc: "Timed, randomised WAEC-style papers with auto-save, question flagging and instant detailed marking.",
    accent: false,
  },
  {
    icon: BookOpen,
    title: "Curriculum Lessons",
    desc: "Video, text and interactive activities mapped exactly to GES topics and WAEC blueprints.",
    accent: true,
  },
  {
    icon: BarChart2,
    title: "Real-time Analytics",
    desc: "Topic mastery, exam readiness and grade projections for students, teachers and parents.",
    accent: false,
  },
  {
    icon: Zap,
    title: "Adaptive Remediation",
    desc: "After every assessment, a personalised revision plan and follow-up practice targets your weak spots.",
    accent: false,
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Role-based access, encrypted data at rest and in transit — examination-grade integrity guaranteed.",
    accent: false,
  },
];

const steps = [
  {
    number: "01",
    icon: PlayCircle,
    title: "Sign up & pick your exam",
    desc: "Choose BECE or WASSCE, select your subjects, and get a personalised study plan ready in minutes.",
    img: "/images/student-laptop.jpg",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Learn with AI-powered lessons",
    desc: "Work through curriculum-aligned lessons, ask the AI tutor anything, and practice with topic quizzes as you go.",
    img: "/images/student-exam.jpg",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Sit mock exams & track progress",
    desc: "Take timed WAEC-style mock papers, get instant results, and watch your readiness score climb.",
    img: "/images/students-writing.jpg",
  },
];

const roles = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Personalised learning paths, daily goals, streaks and an AI tutor that never sleeps.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: BookMarked,
    title: "Teachers",
    desc: "Author lessons, create questions, monitor every learner and spot who needs help early.",
    color: "bg-orange-50 text-orange-700",
  },
  {
    icon: Users,
    title: "Parents",
    desc: "Read-only view of your child's progress, attendance, quiz scores and exam readiness.",
    color: "bg-green-50 text-green-700",
  },
  {
    icon: ShieldCheck,
    title: "Administrators",
    desc: "User management, content approval, platform analytics and school-wide reporting.",
    color: "bg-purple-50 text-purple-700",
  },
];

const beceSubjects = [
  "Career Technology", "Computing", "Creative Arts", "English Language",
  "French", "Ghanaian Language", "Integrated Science", "Mathematics",
  "Religious & Moral Education", "Social Studies",
];

const wassceSubjects = [
  "Biology", "Chemistry", "Core English", "Core Mathematics",
  "Economics", "Elective Mathematics", "Geography", "Government",
  "Integrated Science", "Literature in English", "Physics", "Social Studies",
];

const badges = [
  { icon: Flame, label: "7-day streak", bg: "bg-orange-50", color: "text-orange-500" },
  { icon: Trophy, label: "Mock exam ace", bg: "bg-yellow-50", color: "text-yellow-600" },
  { icon: Award, label: "Topic master", bg: "bg-teal-50", color: "text-teal-600" },
  { icon: Star, label: "Class champion", bg: "bg-purple-50", color: "text-purple-500" },
];

const leaderboard = [
  { name: "Akosua M.", xp: "4,820 XP", rank: 1 },
  { name: "Kwame O.", xp: "4,510 XP", rank: 2 },
  { name: "Yaa A.", xp: "4,270 XP", rank: 3 },
];

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
const activeDays = [0, 1, 2, 3, 4];

function StatNumber({ end, suffix, started, duration = 2200 }: {
  end: number;
  suffix: string;
  started: boolean;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    setCount(0);
    let raf: number;
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return <>{count}{suffix}</>;
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const statsRef = useRef<HTMLElement>(null);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${lora.variable} bg-white min-h-screen antialiased`}>

      {/* ─── NAV ─────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? "mx-3 mt-2 rounded-2xl bg-white/98 shadow-xl border border-slate-200/70 backdrop-blur-md"
          : "bg-white/95 backdrop-blur-sm border-b border-slate-100"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl flex-shrink-0 shadow-sm ring-1 ring-slate-200">
                <Image src="/logo-no-bg.png" alt="" fill sizes="80px" className="object-cover object-top scale-[2] origin-top" priority />
              </div>
              <div className="leading-none">
                <div className="text-[17px] font-extrabold tracking-tight text-[#1B3A8A]">Edu<span className="text-[#0D9E92]">Bridge</span></div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 mt-0.5">Educational Solutions</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href}
                  className="text-sm text-slate-600 hover:text-[#1B3A8A] transition-colors font-medium">
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-[#1B3A8A] hover:underline px-3 py-2">
                Sign in
              </Link>
              <Link href="/signup"
                className="px-4 py-2 bg-[#E8722A] hover:bg-[#d4641e] text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                Get started free
              </Link>
            </div>

            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href}
                className="block text-sm font-medium text-slate-700 py-2"
                onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Link href="/login" className="flex-1 text-center py-2.5 border-2 border-[#1B3A8A] text-[#1B3A8A] text-sm font-bold rounded-lg">
                Sign in
              </Link>
              <Link href="/signup" className="flex-1 text-center py-2.5 bg-[#E8722A] text-white text-sm font-bold rounded-lg">
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="bg-[#F0F4FF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-0 lg:pt-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-end">

            {/* Left */}
            <div className="pb-16 lg:pb-20">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1B3A8A]/20 bg-white text-sm text-[#1B3A8A] font-semibold mb-8 shadow-sm">
                <span>🇬🇭</span> Built for Ghana&apos;s BECE &amp; WASSCE candidates
              </div>

              <h1 className="font-[family-name:var(--font-lora)] leading-[1.1] mb-6">
                <span className="block text-[2.8rem] lg:text-[3.5rem] text-slate-900">Smart learning.</span>
                <span className="block text-[2.8rem] lg:text-[3.5rem] text-[#1B3A8A] italic">Smarter assessment.</span>
                <span className="block text-[2.8rem] lg:text-[3.5rem] text-[#E8722A] font-bold">Better outcomes.</span>
              </h1>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-lg">
                EduBridge AI prepares students for WAEC examinations with curriculum-aligned lessons,
                adaptive mock exams, an always-on AI tutor and real-time analytics for teachers and parents.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
                  Start learning free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-[#1B3A8A] text-[#1B3A8A] font-bold rounded-xl transition-all hover:bg-[#1B3A8A] hover:text-white text-sm">
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
                {["GES & WAEC aligned", "Works on low bandwidth", "Free for students"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#1A6B3C] flex-shrink-0" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — student photo */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-t-3xl overflow-hidden h-[520px]">
                <Image
                  src="/images/hero-student.jpg"
                  alt="Student learning with EduBridge AI"
                  fill
                  className="object-cover object-center"
                  priority
                />
                {/* Overlay gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F0F4FF] to-transparent" />
              </div>

              {/* Floating cards */}
              <div className="absolute top-8 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 w-52">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1B3A8A]/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-[#1B3A8A]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">AI Tutor Ready</p>
                    <p className="text-[10px] text-slate-500">Ask anything</p>
                  </div>
                  <div className="ml-auto h-2 w-2 rounded-full bg-green-400" />
                </div>
                <p className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 italic">
                  &ldquo;Explain quadratic equations in simple terms&rdquo;
                </p>
              </div>

              <div className="absolute top-44 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Mock Exam Score</p>
                <p className="text-3xl font-bold text-[#1B3A8A]">87<span className="text-lg">%</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-[11px] text-green-600 font-semibold">+12% this week</span>
                </div>
              </div>

              <div className="absolute bottom-20 -left-4 bg-[#1B3A8A] rounded-2xl shadow-xl p-3.5 border border-[#1B3A8A]/20 flex items-center gap-3 w-48">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Flame className="h-4 w-4 text-orange-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">12 day streak! 🔥</p>
                  <p className="text-[10px] text-white/60">Keep it going</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ───────────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-[#1B3A8A] relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 lg:gap-0">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center lg:items-start text-center lg:text-left ${
                  i < 3 ? "lg:border-r lg:border-white/15 lg:pr-10" : ""
                } ${i > 0 ? "lg:pl-10" : ""}`}
              >
                <p className="text-5xl lg:text-6xl xl:text-7xl font-black text-[#E8722A] tracking-tight leading-none tabular-nums">
                  <StatNumber end={s.end} suffix={s.suffix} started={statsStarted} />
                </p>
                <p className="text-sm text-white/60 mt-3 font-medium leading-snug max-w-[130px]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Simple to start</p>
            <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-slate-900 leading-tight max-w-2xl mx-auto">
              From sign-up to exam-ready in three steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="group relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:border-[#1B3A8A]/30 hover:shadow-lg transition-all">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={step.img}
                      alt={step.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-[#E8722A] flex items-center justify-center shadow-md">
                        <Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <span className="text-4xl font-[family-name:var(--font-lora)] font-bold text-white/30 leading-none">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#F8F9FF] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Why EduBridge AI</p>
            <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-slate-900 leading-tight max-w-xl">
              Everything a candidate needs in one beautiful place.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className={`rounded-2xl p-6 border transition-all hover:shadow-md ${f.accent
                    ? "bg-[#1B3A8A] border-[#1B3A8A] text-white"
                    : "bg-white border-slate-200 hover:border-[#1B3A8A]/30"
                    }`}>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-5 ${f.accent ? "bg-white/15" : "bg-[#F0F4FF]"}`}>
                    <Icon className={`h-5 w-5 ${f.accent ? "text-white" : "text-[#1B3A8A]"}`} />
                  </div>
                  <h3 className={`font-bold text-[17px] mb-2 ${f.accent ? "text-white" : "text-slate-900"}`}>
                    {f.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${f.accent ? "text-white/75" : "text-slate-500"}`}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── GAMIFICATION ────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left text + cards */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">
                Learn. Earn. Level up.
              </p>
              <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-slate-900 mb-5 leading-tight">
                Studying that feels like leveling up your favourite game.
              </h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Earn XP for every lesson and quiz, keep your daily streak alive, unlock badges and
                climb the school leaderboard.
              </p>
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A8A] hover:bg-[#162f74] text-white font-bold rounded-xl transition-colors text-sm">
                Start earning XP <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right widgets */}
            <div className="space-y-4">
              {/* Streak card */}
              <div className="bg-[#1B3A8A] rounded-3xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <span className="text-sm font-semibold text-white/80">Daily streak</span>
                </div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <span className="font-[family-name:var(--font-lora)] text-6xl font-bold">12</span>
                    <span className="text-xl text-white/60 ml-1.5">days</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/50">Level 8 · Scholar</p>
                    <p className="text-sm font-bold text-[#E8722A]">4,385 / 5,000 XP</p>
                  </div>
                </div>
                <div className="h-2 bg-white/20 rounded-full mb-4">
                  <div className="h-full bg-[#E8722A] rounded-full" style={{ width: "87.7%" }} />
                </div>
                <div className="flex gap-1.5">
                  {weekDays.map((d, i) => (
                    <div key={i}
                      className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeDays.includes(i)
                        ? "bg-[#E8722A] text-white"
                        : "bg-white/10 text-white/30"
                        }`}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges row */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Badges to unlock</h3>
                  <span className="text-xs text-slate-400">8 of 32 earned</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {badges.map((b) => {
                    const BIcon = b.icon;
                    return (
                      <div key={b.label} className={`${b.bg} rounded-xl p-2.5 flex flex-col items-center gap-1.5`}>
                        <BIcon className={`h-5 w-5 ${b.color}`} />
                        <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <h3 className="font-bold text-slate-800 text-sm">School leaderboard</h3>
                  </div>
                  <span className="text-xs text-slate-400">This week</span>
                </div>
                {leaderboard.map((l) => (
                  <div key={l.name} className="flex items-center gap-3 py-1.5">
                    <div className="h-6 w-6 rounded-full bg-[#1B3A8A] text-white text-xs font-bold flex items-center justify-center">
                      {l.rank}
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800">{l.name}</span>
                    <span className="text-sm font-bold text-[#E8722A]">{l.xp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR EVERYONE ────────────────────────────────────────────────── */}
      <section id="for-everyone" className="bg-[#F8F9FF] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Photo */}
            <div className="relative rounded-3xl overflow-hidden h-80 lg:h-[500px] hidden lg:block">
              <Image
                src="/images/teacher.jpg"
                alt="Teacher with students"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A8A]/50 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4">
                <p className="font-bold text-slate-800 text-sm mb-1">Every role. One platform.</p>
                <p className="text-xs text-slate-600">Students, teachers, parents and admins — all connected in real time.</p>
              </div>
            </div>

            {/* Cards */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Built for everyone</p>
              <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-slate-900 mb-10 leading-tight">
                One platform, four tailored experiences.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.title} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#1B3A8A]/30 hover:shadow-sm transition-all">
                      <div className={`h-9 w-9 rounded-xl ${r.color} bg-opacity-20 flex items-center justify-center mb-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1.5">{r.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CURRICULUM ──────────────────────────────────────────────────── */}
      <section id="curriculum" className="bg-white border-y border-slate-100 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#E8722A] mb-4">Curriculum</p>
              <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-slate-900 mb-5 leading-tight">
                BECE and WASSCE subjects, every one of them.
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Tap any subject to jump straight into its topics, notes, videos and practice questions.
              </p>
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A8A] hover:bg-[#162f74] text-white font-bold rounded-xl transition-colors text-sm">
                Browse all subjects <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">BECE · Junior High</p>
                <div className="flex flex-wrap gap-2">
                  {beceSubjects.map((s) => (
                    <Link key={s} href="/signup"
                      className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-[#1B3A8A] hover:bg-[#F0F4FF] hover:text-[#1B3A8A] text-sm text-slate-700 font-medium transition-all">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">WASSCE · Senior High</p>
                <div className="flex flex-wrap gap-2">
                  {wassceSubjects.map((s) => (
                    <Link key={s} href="/signup"
                      className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-[#E8722A] hover:bg-orange-50 hover:text-[#E8722A] text-sm text-slate-700 font-medium transition-all">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / PHOTO BREAK ──────────────────────────────────── */}
      <section className="relative h-72 lg:h-96 overflow-hidden">
        <Image
          src="/images/bece-results.jpg"
          alt="Students celebrating BECE results"
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-[#1B3A8A]/70" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <p className="font-[family-name:var(--font-lora)] text-3xl lg:text-5xl text-white font-bold max-w-3xl leading-tight mb-4">
            &ldquo;Every Ghanaian student deserves a world-class education.&rdquo;
          </p>
          <p className="text-white/70 text-sm font-medium">— EduBridge AI Mission</p>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FF] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1B3A8A] rounded-3xl relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0 items-stretch">
              {/* Left — text + buttons */}
              <div className="px-8 py-16 sm:px-14 lg:px-16 relative z-10">
                <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-[#E8722A]/20 -translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                  <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-white mb-4 leading-tight">
                    Your best result is one practice away.
                  </h2>
                  <p className="text-white/70 text-lg mb-8">
                    Join EduBridge AI today. Free for students, always.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/signup"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all shadow-lg text-sm">
                      Create my free account <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/login"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm border border-white/20">
                      Sign in to dashboard
                    </Link>
                  </div>
                </div>
              </div>
              {/* Right — photo */}
              <div className="relative hidden lg:block min-h-[340px]">
                <Image
                  src="/images/students-uniforms.jpg"
                  alt="EduBridge students"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1B3A8A]/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative h-10 w-10 overflow-hidden rounded-xl flex-shrink-0 bg-white/10 ring-1 ring-white/20">
                  <Image src="/logo-no-bg.png" alt="" fill sizes="80px" className="object-cover object-top scale-[2] origin-top" />
                </div>
                <div className="leading-none">
                  <div className="text-[17px] font-extrabold tracking-tight text-white">Edu<span className="text-[#2DD4BF]">Bridge</span></div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400 mt-0.5">Educational Solutions</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Ghana&apos;s most advanced BECE and WASSCE exam preparation platform.
                Curriculum-aligned, AI-powered, free for students.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Platform</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#curriculum" className="hover:text-white transition-colors">Subjects</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#for-everyone" className="hover:text-white transition-colors">For everyone</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Get started</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/signup" className="hover:text-white transition-colors">Create account</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">For schools</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              © 2026 EduBridge Educational Solutions. Made for Ghana 🇬🇭
            </p>
            <p className="text-sm text-slate-500">
              Smart Learning. Smarter Assessment. Better Outcomes.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
