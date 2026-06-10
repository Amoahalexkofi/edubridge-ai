import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const features = [
  "BECE & WASSCE aligned curriculum, every subject",
  "AI tutor available 24/7 — explains in English or Twi",
  "Mock exams, live analytics and personalised remediation",
];

const avatars = [
  { initials: "KA", bg: "bg-blue-400" },
  { initials: "YM", bg: "bg-[#E8722A]" },
  { initials: "AB", bg: "bg-green-500" },
  { initials: "NA", bg: "bg-purple-400" },
];

export default function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col overflow-hidden">
      {/* Photo background */}
      <Image
        src="/images/classroom.jpg"
        alt=""
        fill
        className="object-cover object-center"
        priority
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1533]/97 via-[#0d1f50]/92 to-[#1B3A8A]/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">

        {/* Logo */}
        <div>
          <Image
            src="/logo.jpeg"
            alt="EduBridge Youth Academy"
            width={160}
            height={50}
            className="h-11 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Main copy */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/75 text-xs font-semibold tracking-wide mb-7">
              <span>🇬🇭</span> Ghana&apos;s #1 Exam Prep Platform
            </div>
            <h2 className="text-white text-[2.1rem] xl:text-[2.5rem] font-bold leading-[1.15] tracking-tight">
              Ghana&apos;s BECE &amp;<br />
              WASSCE prep,<br />
              <span className="text-[#E8722A]">reimagined.</span>
            </h2>
            <p className="mt-4 text-white/55 text-sm leading-relaxed max-w-[280px]">
              Curriculum-aligned lessons, adaptive practice, and live analytics — all in one platform.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="h-[18px] w-[18px] text-[#E8722A] flex-shrink-0 mt-0.5" />
                <p className="text-white/75 text-sm leading-snug">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div>
          <div className="h-px bg-white/10 mb-6" />
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {avatars.map((a) => (
                <div
                  key={a.initials}
                  className={`h-9 w-9 rounded-full ${a.bg} border-2 border-[#0a1533] flex items-center justify-center text-[11px] font-bold text-white`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">5,000+ students</p>
              <p className="text-white/40 text-xs">already preparing smarter</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
