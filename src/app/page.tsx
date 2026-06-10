"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain, Clock, BookOpen, BarChart2, Zap, Shield,
  GraduationCap, BookMarked, Users, ShieldCheck,
  Menu, X, ArrowRight, CheckCircle2, Flame, Trophy, Award, Star,
} from "lucide-react";
import { Lora } from "next/font/google";

const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Subjects", href: "#curriculum" },
  { label: "For everyone", href: "#for-everyone" },
];

const stats = [
  { value: "22", label: "BECE & WASSCE subjects" },
  { value: "10k+", label: "WAEC-style questions" },
  { value: "24/7", label: "AI tutor availability" },
  { value: "100%", label: "Curriculum aligned" },
];

const features = [
  { icon: Brain, title: "AI tutor", desc: "Explains concepts in plain English or your own language, generates examples and quizzes on demand." },
  { icon: Clock, title: "Mock exam engine", desc: "Timed, randomized WAEC-style papers with auto-save, flagging and instant marking." },
  { icon: BookOpen, title: "Curriculum lessons", desc: "Video, text and interactive activities mapped to GES topics and WAEC blueprints." },
  { icon: BarChart2, title: "Real-time analytics", desc: "Topic mastery, exam readiness and grade projections for students, teachers and parents." },
  { icon: Zap, title: "Adaptive remediation", desc: "After every assessment, a personalized revision plan and follow-up practice." },
  { icon: Shield, title: "Secure & private", desc: "Role-based access, encrypted at rest and in transit, examination-grade integrity." },
];

const roles = [
  { icon: GraduationCap, title: "Students", desc: "Personalized learning paths, daily goals, streaks and live tutoring." },
  { icon: BookMarked, title: "Teachers", desc: "Author content, create questions and monitor every learner." },
  { icon: Users, title: "Parents", desc: "Read-only view of progress, attendance and exam results." },
  { icon: ShieldCheck, title: "Administrators", desc: "User management, content approval and platform analytics." },
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

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`${lora.variable} bg-[#F8F5EE] min-h-screen`}>

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-[#F8F5EE]/95 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="h-8 w-8 bg-[#1A4731] rounded-lg flex items-center justify-center">
                <GraduationCap className="h-[18px] w-[18px] text-white" />
              </div>
              <span className="font-bold text-[#1A1A1A] text-[17px] tracking-tight">
                EduBridge <span className="text-[#1A4731]">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href}
                  className="text-sm text-[#4A4A4A] hover:text-[#1A4731] transition-colors font-medium">
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-[#1A4731] hover:underline px-3 py-2">
                Sign in
              </Link>
              <Link href="/signup"
                className="px-4 py-2 bg-[#1A4731] hover:bg-[#133626] text-white text-sm font-semibold rounded-lg transition-colors">
                Get started
              </Link>
            </div>

            <button className="md:hidden p-2 rounded-lg hover:bg-black/[0.05]" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-black/[0.06] bg-[#F8F5EE] px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href}
                className="block text-sm font-medium text-[#4A4A4A] py-1.5"
                onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2 border-t border-black/[0.06] mt-2">
              <Link href="/login" className="flex-1 text-center py-2.5 border border-[#1A4731] text-[#1A4731] text-sm font-semibold rounded-lg">
                Sign in
              </Link>
              <Link href="/signup" className="flex-1 text-center py-2.5 bg-[#1A4731] text-white text-sm font-semibold rounded-lg">
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1A4731]/20 bg-white text-sm text-[#1A4731] font-medium mb-8">
              <span>✨</span>
              <span>Built for Ghana&apos;s BECE &amp; WASSCE candidates</span>
            </div>
            <h1 className="font-[family-name:var(--font-lora)] leading-[1.1] mb-6">
              <span className="block text-5xl lg:text-6xl text-[#1A1A1A]">Smart learning.</span>
              <span className="block text-5xl lg:text-6xl text-[#1A4731] italic">Smarter assessment.</span>
              <span className="block text-5xl lg:text-6xl text-[#1A4731] font-bold">Better outcomes.</span>
            </h1>
            <p className="text-[#5A5A5A] text-lg leading-relaxed mb-8 max-w-lg">
              EduBridge AI prepares students for WAEC examinations with curriculum-aligned lessons,
              adaptive mock exams, an always-on AI tutor and real-time analytics for teachers and parents.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A4731] hover:bg-[#133626] text-white font-semibold rounded-xl transition-colors text-sm">
                Start learning free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#1A1A1A]/20 hover:border-[#1A4731] hover:text-[#1A4731] text-[#1A1A1A] font-semibold rounded-xl transition-colors text-sm">
                See how it works
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-[#5A5A5A]">
              {["GES & WAEC aligned", "Works on low bandwidth", "Free for students"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#1A4731] flex-shrink-0" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:flex flex-col">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A4731]/15 via-[#2D6A4F]/10 to-[#1A4731]/5 aspect-[4/5] flex items-end justify-center">
              {/* Decorative rings */}
              <div className="absolute top-12 right-12 h-40 w-40 rounded-full border-2 border-[#1A4731]/10" />
              <div className="absolute top-20 right-20 h-24 w-24 rounded-full border border-[#1A4731]/10" />
              <div className="absolute bottom-24 left-8 h-20 w-20 rounded-full bg-[#1A4731]/5" />

              {/* Mock lesson card */}
              <div className="absolute top-10 left-8 bg-white rounded-2xl shadow-md p-4 w-44 border border-black/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                    <BookOpen className="h-3.5 w-3.5 text-[#1D4ED8]" />
                  </div>
                  <span className="text-xs font-semibold text-[#1A1A1A]">Mathematics</span>
                </div>
                <p className="text-[10px] text-[#6B7280] mb-2">Quadratic Equations</p>
                <div className="h-1.5 bg-[#E5E5E5] rounded-full">
                  <div className="h-full w-[65%] bg-[#1A4731] rounded-full" />
                </div>
                <p className="text-[10px] text-[#1A4731] font-medium mt-1">65% complete</p>
              </div>

              {/* Score badge */}
              <div className="absolute top-10 right-6 bg-[#1A4731] rounded-2xl shadow-md p-3 text-center">
                <p className="text-2xl font-bold text-white">87%</p>
                <p className="text-[10px] text-white/70">Mock exam</p>
              </div>

              {/* Center illustration */}
              <div className="flex flex-col items-center justify-center h-full pb-24 text-[#1A4731]/20">
                <GraduationCap className="h-32 w-32" />
              </div>
            </div>

            {/* Floating AI tutor card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 border border-black/[0.06]">
              <div className="h-10 w-10 rounded-xl bg-[#1A4731]/10 flex items-center justify-center flex-shrink-0">
                <Brain className="h-5 w-5 text-[#1A4731]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1A1A1A]">AI tutor ready</p>
                <p className="text-xs text-[#6B7280]">Ask anything from your syllabus</p>
              </div>
              <div className="ml-auto h-2.5 w-2.5 rounded-full bg-[#22C55E] flex-shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-[#1A4731]/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl font-bold text-[#1A4731]">
                  {s.value}
                </p>
                <p className="text-sm text-[#6B7280] mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <p className="text-xs font-bold tracking-widest uppercase text-[#1A4731] mb-4">Why EduBridge AI</p>
        <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-[#1A1A1A] mb-14 max-w-xl leading-tight">
          Everything a candidate needs in one beautiful place.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`bg-white rounded-2xl p-6 border border-[#E5E5E5] ${i === 2 ? "lg:bg-[#1A4731] lg:border-[#1A4731] lg:text-white" : ""}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${i === 2 ? "bg-white/15" : "bg-[#F0F7F3]"}`}>
                  <Icon className={`h-5 w-5 ${i === 2 ? "text-white" : "text-[#1A4731]"}`} />
                </div>
                <h3 className={`font-semibold text-[17px] mb-2 ${i === 2 ? "text-white" : "text-[#1A1A1A]"}`}>
                  {f.title}
                </h3>
                <p className={`text-sm leading-relaxed ${i === 2 ? "text-white/70" : "text-[#6B7280]"}`}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* GAMIFICATION */}
      <section className="bg-white border-y border-[#E5E5E5] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-widest uppercase text-[#1A4731] mb-4">Learn. Earn. Level up.</p>
          <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-[#1A1A1A] mb-6 max-w-2xl leading-tight">
            Studying that feels like leveling up your favourite game.
          </h2>
          <p className="text-[#5A5A5A] text-lg mb-14 max-w-xl">
            Earn XP for every lesson and quiz, keep your daily streak alive, unlock badges and climb the school leaderboard.
          </p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Streak card */}
            <div className="bg-[#1A4731] rounded-3xl p-7 text-white">
              <div className="flex items-center gap-2 mb-5">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-medium text-white/80">Daily streak</span>
              </div>
              <div className="mb-5">
                <span className="font-[family-name:var(--font-lora)] text-7xl font-bold">12</span>
                <span className="text-2xl text-white/70 ml-2">days</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>Level 8 · Scholar</span>
                <span>4,385 / 5,000 XP</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full mb-5">
                <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: "87.7%" }} />
              </div>
              <p className="text-xs text-white/50 mb-3">615 XP to Level 9 · Strategist</p>
              <div className="flex gap-2">
                {weekDays.map((d, i) => (
                  <div key={i}
                    className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${activeDays.includes(i)
                      ? "bg-[#F59E0B] text-[#1A1A1A]"
                      : "bg-white/10 text-white/30"
                      }`}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Badges + leaderboard */}
            <div className="space-y-5">
              <div className="bg-[#F8F5EE] rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1A1A1A]">Badges to unlock</h3>
                  <span className="text-xs text-[#6B7280]">8 of 32 earned</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {badges.map((b) => {
                    const BIcon = b.icon;
                    return (
                      <div key={b.label}
                        className={`${b.bg} rounded-2xl p-3 flex flex-col items-center gap-2 border border-black/[0.04]`}>
                        <BIcon className={`h-6 w-6 ${b.color}`} />
                        <span className="text-[10px] font-medium text-center text-[#1A1A1A] leading-tight">
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#F8F5EE] rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#F59E0B]" />
                    <h3 className="font-semibold text-[#1A1A1A] text-sm">School leaderboard</h3>
                  </div>
                  <span className="text-xs text-[#6B7280]">This week</span>
                </div>
                <div className="space-y-3">
                  {leaderboard.map((l) => (
                    <div key={l.name} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-[#1A4731] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {l.rank}
                      </div>
                      <span className="flex-1 text-sm font-medium text-[#1A1A1A]">{l.name}</span>
                      <span className="text-sm font-bold text-[#1A4731]">{l.xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR EVERYONE */}
      <section id="for-everyone" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <p className="text-xs font-bold tracking-widest uppercase text-[#1A4731] mb-4">Built for everyone</p>
        <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-[#1A1A1A] mb-14 max-w-xl leading-tight">
          One platform, four tailored experiences.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="bg-white rounded-2xl p-6 border border-[#E5E5E5] hover:border-[#1A4731]/30 hover:shadow-sm transition-all">
                <Icon className="h-7 w-7 text-[#1A4731] mb-4" />
                <h3 className="font-semibold text-[#1A1A1A] text-[17px] mb-2">{r.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CURRICULUM */}
      <section id="curriculum" className="bg-white border-y border-[#E5E5E5] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-widest uppercase text-[#1A4731] mb-4">Curriculum</p>
          <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-[#1A1A1A] mb-4 max-w-xl leading-tight">
            BECE and WASSCE subjects, every one of them.
          </h2>
          <p className="text-[#5A5A5A] text-lg mb-12 max-w-xl">
            Tap a subject to jump straight into its topics, notes, videos and practice questions.
          </p>
          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#6B7280] uppercase mb-4">BECE · Junior High</p>
              <div className="flex flex-wrap gap-2.5">
                {beceSubjects.map((s) => (
                  <Link key={s} href="/signup"
                    className="px-4 py-2 rounded-full border border-[#E5E5E5] bg-[#F8F5EE] hover:border-[#1A4731] hover:text-[#1A4731] text-sm text-[#1A1A1A] font-medium transition-colors">
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-[#6B7280] uppercase mb-4">WASSCE · Senior High</p>
              <div className="flex flex-wrap gap-2.5">
                {wassceSubjects.map((s) => (
                  <Link key={s} href="/signup"
                    className="px-4 py-2 rounded-full border border-[#E5E5E5] bg-[#F8F5EE] hover:border-[#1A4731] hover:text-[#1A4731] text-sm text-[#1A1A1A] font-medium transition-colors">
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1A1A1A]/20 hover:border-[#1A4731] hover:text-[#1A4731] text-[#1A1A1A] text-sm font-semibold rounded-xl transition-colors">
              Browse all subjects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="bg-[#1A4731] rounded-3xl px-8 py-16 sm:px-14 text-center">
          <h2 className="font-[family-name:var(--font-lora)] text-4xl lg:text-5xl text-white mb-4 leading-tight max-w-2xl mx-auto">
            Your best result is one practice away.
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Join EduBridge AI today. Free for students, always.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E8902A] hover:bg-[#D17A1F] text-white font-bold rounded-xl transition-colors text-sm">
            Create my free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1A4731]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            © 2026 EduBridge Educational Solutions. Made for Ghana 🇬🇭
          </p>
          <p className="text-sm text-[#6B7280]">
            Smart Learning. Smarter Assessment. Better Outcomes.
          </p>
        </div>
      </footer>

    </div>
  );
}
