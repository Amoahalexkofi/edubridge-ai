import Image from "next/image";
import { BookOpen, Sparkles, BarChart3 } from "lucide-react";

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
    <div className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between bg-[#0d1f50] p-12 overflow-hidden">
      {/* Gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B3A8A]/90 via-[#0d1f50]/80 to-[#0d1f50] pointer-events-none" />

      {/* Decorative rings */}
      <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full border border-white/[0.05] pointer-events-none" />
      <div className="absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full border border-white/[0.04] pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 h-[480px] w-[480px] rounded-full border border-[#E8722A]/[0.06] pointer-events-none" />
      <div className="absolute bottom-1/3 right-12 h-2 w-2 rounded-full bg-[#E8722A]/30 pointer-events-none" />
      <div className="absolute top-1/3 left-16 h-1.5 w-1.5 rounded-full bg-white/20 pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10">
        <Image
          src="/logo.jpeg"
          alt="EduBridge Youth Academy"
          width={160}
          height={50}
          className="h-11 w-auto object-contain brightness-0 invert"
          priority
        />
      </div>

      {/* Main copy */}
      <div className="relative z-10 space-y-10">
        <div>
          <h2 className="text-white text-[2.1rem] font-bold leading-[1.18] tracking-tight">
            Ghana&apos;s BECE &amp;<br />
            WASSCE prep,<br />
            <span className="text-[#E8722A]">reimagined.</span>
          </h2>
          <p className="mt-4 text-white/50 text-[0.9rem] leading-relaxed max-w-[260px]">
            Curriculum-aligned lessons, adaptive practice, and live analytics — all in one platform.
          </p>
        </div>

        <div className="space-y-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon className="h-[17px] w-[17px] text-[#E8722A]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-snug">{f.title}</p>
                <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <div className="h-px bg-gradient-to-r from-white/10 to-transparent mb-5" />
        <p className="text-white/30 text-xs tracking-widest uppercase font-medium">
          Built for Ghanaian students &amp; educators 🇬🇭
        </p>
      </div>
    </div>
  );
}
