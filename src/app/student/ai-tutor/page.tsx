import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Brain, Sparkles, BookOpen, Zap, MessageCircle, Target, Clock } from "lucide-react";

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
      desc: "Get instant, curriculum-aligned answers to any question from your subjects.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Target,
      title: "Personalised explanations",
      desc: `Explanations tailored specifically to ${exam} topics — no irrelevant content.`,
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: Zap,
      title: "Step-by-step workings",
      desc: "For maths and science, the AI shows every step clearly — just like a teacher on paper.",
      color: "bg-orange-50 text-[#E8722A]",
    },
    {
      icon: BookOpen,
      title: "Lesson support",
      desc: "Stuck on a lesson? Ask the AI to explain it differently until it clicks.",
      color: "bg-green-50 text-green-600",
    },
  ];

  const sampleQuestions = [
    "Explain fractions in simple terms",
    "How do I solve a linear equation?",
    "What is the difference between mean and median?",
    "Help me understand photosynthesis",
    "How do I find the LCM of two numbers?",
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">AI Tutor</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8722A] text-white uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-white/70 text-sm">Your personal {exam} study assistant</p>
          </div>
        </div>

        <p className="text-white/80 text-sm leading-relaxed">
          Hi {firstName}! Your AI Tutor is being trained on the full {exam} curriculum.
          It will be ready in <strong className="text-white">July 2026</strong> — and when it
          arrives, it will answer any question instantly, explain concepts step by step,
          and help you study smarter.
        </p>

        <div className="flex items-center gap-2 mt-4 bg-white/10 rounded-xl px-4 py-3">
          <Clock className="h-4 w-4 text-white/60 flex-shrink-0" />
          <p className="text-sm text-white/70">
            <span className="font-semibold text-white">Estimated launch:</span> July 2026 · Powered by Claude AI
          </p>
        </div>
      </div>

      {/* What it will do */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
          What the AI Tutor will do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-bold text-sm text-[#0f172a]">{title}</p>
              <p className="text-xs text-[#64748B] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mock chat preview */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
          Preview — questions you can ask
        </h2>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <div className="h-8 w-8 rounded-full bg-[#1B3A8A] flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f172a]">EduBridge AI Tutor</p>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8]">Coming July 2026</span>
              </div>
            </div>
            <div className="ml-auto">
              <Sparkles className="h-4 w-4 text-[#E8722A]" />
            </div>
          </div>

          {/* Sample questions */}
          <div className="p-4 space-y-2">
            <p className="text-xs text-[#94a3b8] mb-3">Sample questions students will be able to ask:</p>
            {sampleQuestions.map((q) => (
              <div
                key={q}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#334155] opacity-70"
              >
                <MessageCircle className="h-4 w-4 text-[#CBD5E1] flex-shrink-0" />
                &ldquo;{q}&rdquo;
              </div>
            ))}
          </div>

          {/* Locked input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 h-11 px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#CBD5E1]">
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <span>Ask your AI Tutor anything... (available July 2026)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Study tip while waiting */}
      <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-[#E8722A] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-[#92400E]">While you wait</p>
          <p className="text-xs text-[#92400E]/80 mt-0.5 leading-relaxed">
            Complete your {exam} lessons now to build a strong foundation. The AI Tutor will
            personalise its help based on what you&apos;ve already studied — the more you do now,
            the smarter it will be for you.
          </p>
        </div>
      </div>
    </div>
  );
}
