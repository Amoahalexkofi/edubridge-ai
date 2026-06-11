"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, PenLine,
  FileText, User, LogOut, GraduationCap, Flame,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/student",          label: "Home",     icon: LayoutDashboard },
  { href: "/student/subjects", label: "Subjects", icon: BookOpen        },
  { href: "/student/practice", label: "Practice", icon: PenLine         },
  { href: "/student/exams",    label: "Exams",    icon: FileText        },
  { href: "/student/profile",  label: "Profile",  icon: User            },
];

interface Props {
  userName: string;
  examTarget: string | null;
  avatarUrl: string | null;
}

export default function StudentNav({ userName, examTarget, avatarUrl }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/student") return pathname === "/student";
    return pathname.startsWith(href);
  }

  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Mobile top header ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
        <Link href="/student">
          <Image src="/logo-no-bg.png" alt="EduBridge Educational Solutions" width={120} height={120} className="h-11 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2.5">
          {examTarget && (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#1B3A8A]/10 text-[#1B3A8A] border border-[#1B3A8A]/20">
              {examTarget}
            </span>
          )}
          {avatarUrl ? (
            <Image src={avatarUrl} alt={userName} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#1B3A8A] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.06)]" style={{ height: "64px" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 rounded-xl transition-colors ${
                active ? "text-[#1B3A8A]" : "text-slate-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className={`text-[10px] font-semibold ${active ? "text-[#1B3A8A]" : "text-slate-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-slate-100">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100">
          <Link href="/student">
            <Image src="/logo-no-bg.png" alt="EduBridge Educational Solutions" width={140} height={140} className="h-16 w-auto object-contain" />
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-[#1B3A8A]/8 text-[#1B3A8A]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                {label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E8722A]" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          {examTarget && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1B3A8A]/5">
              <GraduationCap className="h-4 w-4 text-[#1B3A8A]" />
              <span className="text-xs font-bold text-[#1B3A8A] uppercase tracking-wide">{examTarget} Candidate</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={userName} width={36} height={36} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1B3A8A] to-[#2d4fa0] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Flame className="h-3 w-3 text-[#E8722A]" /> Student
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
