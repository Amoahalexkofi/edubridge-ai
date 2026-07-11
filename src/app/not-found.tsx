import Link from "next/link";
import Image from "next/image";
import { Home, LogIn, Compass } from "lucide-react";

// Branded 404 — shown for any URL that isn't a real route (e.g. a mistyped
// or truncated address). Renders on the bare root layout, so it's fully
// self-contained and centered.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F3EF] to-[#E5E3DC] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E4DE] eb-card p-8 sm:p-10 text-center">
        <Link href="/" className="inline-block mb-6">
          <Image
            src="/logo-no-bg.png"
            alt="EduBridge Educational Solutions"
            width={160}
            height={64}
            className="h-14 w-auto object-contain mx-auto"
          />
        </Link>

        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Compass className="h-7 w-7 text-white" />
        </div>

        <p className="text-4xl font-black text-[#0f172a] tabular-nums leading-none">404</p>
        <h1 className="text-lg font-bold text-[#0f172a] mt-3">This page doesn&apos;t exist</h1>
        <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
          The link may be mistyped or out of date. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
          <Link
            href="/student"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors"
          >
            <Home className="h-4 w-4" /> Go to dashboard
          </Link>
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E6E4DE] text-sm font-semibold text-[#334155] hover:bg-[#F8F7F4] transition-colors"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
