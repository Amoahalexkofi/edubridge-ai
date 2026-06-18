import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Brain, Sparkles, BookOpen, Zap,
  MessageCircle, Target, Clock, ChevronRight, Star,
} from "lucide-react";

export default async function AITutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const exam = (profile?.exam_target ?? "bece").toUpperCase();

  const features = [
    {
      icon: MessageCircle,
      title: "Ask anything",
      desc: "Get instant, curriculum-aligned answers to any question across all your subjects.",
      gradient: "from-blue-500 to-blue-600",
      light: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      icon: Target,
      title: "Personalised explanations",
      desc: `Answers tailored specifically to the ${exam} curriculum — no irrelevant content, ever.`,
      gradient: "from-purple-500 to-purple-600",
      light: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      icon: Zap,
      title: "Step-by-step workings",
      desc: "For maths and science, every step is shown clearly — exactly like a teacher on paper.",
      gradient: "from-orange-400 to-orange-500",
      light: "bg-orange-50",
      text: "text-[#E8722A]",
    },
    {
      icon: BookOpen,
      title: "Lesson support",
      desc: "Stuck on a concept? Ask the AI to explain it a different way until it finally clicks.",
      gradient: "from-green-500 to-green-600",
      light: "bg-green-50",
      text: "text-green-600",
    },
  ];

  const conversation = [
    {
      role: "student",
      text: "Can you explain how to add fractions with different denominators?",
    },
    {
      role: "ai",
      text: `Great question! To add fractions with different denominators, follow these steps:\n\n**Step 1 — Find the LCM** of the two denominators.\nFor ¹⁄₃ + ¹⁄₄, the LCM of 3 and 4 is **12**.\n\n**Step 2 — Convert both fractions** to the same denominator.\n¹⁄₃ = ⁴⁄₁₂   and   ¹⁄₄ = ³⁄₁₂\n\n**Step 3 — Add the numerators.**\n⁴⁄₁₂ + ³⁄₁₂ = **⁷⁄₁₂** ✓`,
    },
    {
      role: "student",
      text: "What if the denominators are bigger, like ⅕ + ⅙?",
    },
    {
      role: "ai",
      text: "Same steps! LCM of 5 and 6 is 30.\n⅕ = ⁶⁄₃₀   and   ⅙ = ⁵⁄₃₀\nSo  ⁶⁄₃₀ + ⁵⁄₃₀ = **¹¹⁄₃₀** ✓\n\nThe pattern always works — find LCM, convert, then add. 🎯",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B3A8A] via-[#1D4ED8] to-[#2563EB] p-6 sm:p-8">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white/5 translate-y-1/2" />

        <div className="relative grid sm:grid-cols-2 gap-6 items-center">
          {/* Left */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#E8722A] text-white">
                <Clock className="h-3 w-3" /> Coming July 2026
              </span>
              <span className="text-xs text-white/50 font-medium">Powered by Claude AI</span>
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-white leading-tight">
                Your personal<br />
                <span className="text-[#93C5FD]">AI Tutor</span>
              </h1>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">
                Hi <span className="font-bold text-white">{firstName}</span>! The {exam} AI Tutor
                is being trained on the full curriculum. When it launches, it will answer any
                question instantly — step by step, just like a teacher.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-white">24/7</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Available</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{exam}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Aligned</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">∞</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Questions</p>
              </div>
            </div>
          </div>

          {/* Right — mini chat bubble preview */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white/15 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white leading-relaxed max-w-[260px]">
                Hi {firstName}! What would you like to learn today?
              </div>
            </div>
            <div className="flex items-start gap-2.5 flex-row-reverse">
              <div className="h-7 w-7 rounded-full bg-[#E8722A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-white">{firstName[0]}</span>
              </div>
              <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-[#1B3A8A] font-medium max-w-[260px]">
                Explain quadratic equations in simple terms
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white/15 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white leading-relaxed max-w-[260px]">
                Sure! A quadratic equation is any equation in the form <strong>ax² + bx + c = 0</strong>. Let me break it down step by step...
              </div>
            </div>
            {/* Typing indicator */}
            <div className="flex items-center gap-2 pl-9 opacity-50">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-white/60">AI Tutor is thinking…</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-4">What the AI Tutor will do</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map(({ icon: Icon, title, desc, gradient, light, text }) => (
            <div key={title} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 hover:shadow-md hover:border-[#1D4ED8]/20 transition-all group">
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0f172a] leading-snug">{title}</p>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sample conversation ───────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-4">Preview — a real conversation</p>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#0f172a]">EduBridge AI Tutor</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                <span className="text-[11px] text-[#94a3b8]">Preview — not yet active</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#E8722A] bg-orange-50 px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> Claude AI
            </div>
          </div>

          {/* Conversation */}
          <div className="px-5 py-5 space-y-4 opacity-80">
            {conversation.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === "student" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "ai"
                    ? "bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8]"
                    : "bg-[#E8722A]"
                }`}>
                  {msg.role === "ai"
                    ? <Brain className="h-4 w-4 text-white" />
                    : <span className="text-[11px] font-black text-white">{firstName[0]}</span>
                  }
                </div>
                {/* Bubble */}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "ai"
                    ? "bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] rounded-tl-sm"
                    : "bg-[#1D4ED8] text-white rounded-tr-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Locked input */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 h-12 px-4 rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#CBD5E1]">
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">Ask your AI Tutor anything...</span>
              <span className="text-[11px] font-bold text-[#E8722A] bg-orange-50 px-2.5 py-1 rounded-full flex-shrink-0">
                July 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-5 flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#E8722A] flex items-center justify-center flex-shrink-0">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#92400E]">Study now, learn smarter later</p>
            <p className="text-xs text-[#92400E]/70 mt-1 leading-relaxed">
              Complete your lessons now. The AI Tutor will personalise its help based on what you&apos;ve already studied.
            </p>
          </div>
        </div>

        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#15803D] flex items-center justify-center flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#14532D]">Continue your {exam} subjects</p>
            <p className="text-xs text-[#14532D]/70 mt-1 leading-relaxed">
              You have lessons ready to complete. Every lesson brings you one step closer to exam day.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
