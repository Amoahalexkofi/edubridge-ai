import { GraduationCap, BookOpen, Sparkles, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "BECE & WASSCE curriculum",
    desc: "Every lesson mapped to the Ghana Education Service syllabus",
  },
  {
    icon: Sparkles,
    title: "AI-powered practice",
    desc: "Questions that adapt to your level and close your knowledge gaps",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    desc: "Progress dashboards for students, teachers and parents",
  },
];

export default function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between bg-[#0f172a] p-12 overflow-hidden">
      {/* Gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D4ED8]/80 via-[#1e3a8a]/60 to-transparent pointer-events-none" />

      {/* Decorative rings */}
      <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full border border-white/[0.06] pointer-events-none" />
      <div className="absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full border border-white/[0.05] pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 h-[480px] w-[480px] rounded-full border border-white/[0.04] pointer-events-none" />
      <div className="absolute bottom-1/3 right-12 h-2 w-2 rounded-full bg-blue-400/40 pointer-events-none" />
      <div className="absolute top-1/3 left-16 h-1.5 w-1.5 rounded-full bg-blue-300/30 pointer-events-none" />

      {/* Brand mark */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none tracking-tight">EduBridge</p>
          <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase mt-0.5">Youth Academy</p>
        </div>
      </div>

      {/* Main copy */}
      <div className="relative z-10 space-y-10">
        <div>
          <h2 className="text-white text-[2.1rem] font-bold leading-[1.18] tracking-tight">
            Ghana&apos;s BECE &amp;<br />
            WASSCE prep,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              reimagined.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-[0.9rem] leading-relaxed max-w-[260px]">
            Curriculum-aligned lessons, adaptive practice, and live analytics — all in one platform.
          </p>
        </div>

        <div className="space-y-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon className="h-[17px] w-[17px] text-blue-300" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-snug">{f.title}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <div className="h-px bg-gradient-to-r from-white/10 to-transparent mb-5" />
        <p className="text-slate-500 text-xs tracking-widest uppercase font-medium">
          Built for Ghanaian students &amp; educators
        </p>
      </div>
    </div>
  );
}
