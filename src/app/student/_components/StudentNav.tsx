"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, PenLine,
  FileText, User, LogOut, GraduationCap,
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
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpeg" alt="EduBridge AI" width={100} height={68} className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          {examTarget && (
            <span className="hidden xs:inline-flex text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              {examTarget}
            </span>
          )}
          <div className="h-8 w-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white border-t border-[#E2E8F0] flex items-center justify-around px-2 safe-bottom">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1 rounded-xl transition-colors ${
                active ? "text-[#1D4ED8]" : "text-[#94a3b8]"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-[#1D4ED8]" : "text-[#94a3b8]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-[#E2E8F0]">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0]">
          <Image src="/logo.jpeg" alt="EduBridge AI" width={130} height={88} className="h-9 w-auto object-contain" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#EFF6FF] text-[#1D4ED8]"
                    : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0f172a]"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-[#E2E8F0] p-3 space-y-1">
          {examTarget && (
            <div className="flex items-center gap-2 px-3 py-2">
              <GraduationCap className="h-4 w-4 text-[#1D4ED8]" />
              <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wide">{examTarget}</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0f172a] truncate">{userName}</p>
              <p className="text-xs text-[#94a3b8]">Student</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
