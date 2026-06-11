"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, PenLine, FileText, Users, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/teacher",           label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/subjects",  label: "Subjects",  icon: BookOpen        },
  { href: "/teacher/lessons",   label: "Lessons",   icon: FileText        },
  { href: "/teacher/questions", label: "Questions", icon: PenLine         },
  { href: "/teacher/students",  label: "Students",  icon: Users           },
];

interface Props { userName: string }

export default function TeacherNav({ userName }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/teacher") return pathname === "/teacher";
    return pathname.startsWith(href);
  }

  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
        <Link href="/teacher" className="flex items-center gap-2 shrink-0">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl flex-shrink-0 shadow-sm ring-1 ring-slate-100">
            <Image src="/logo.jpeg" alt="" fill sizes="72px" className="object-cover object-top scale-[2] origin-top" />
          </div>
          <div className="leading-none">
            <div className="text-[14px] font-extrabold tracking-tight text-[#1B3A8A]">Edu<span className="text-[#0D9E92]">Bridge</span></div>
            <div className="text-[7.5px] font-semibold uppercase tracking-[0.11em] text-slate-400 mt-0.5">Educational Solutions</div>
          </div>
        </Link>
        <div className="h-8 w-8 rounded-full bg-[#E8722A] flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe" style={{ height: "64px" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 rounded-xl transition-colors ${active ? "text-[#E8722A]" : "text-slate-400"}`}>
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className={`text-[10px] font-semibold ${active ? "text-[#E8722A]" : "text-slate-400"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-slate-100">
        <div className="h-16 flex items-center px-4 border-b border-slate-100">
          <Link href="/teacher" className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl flex-shrink-0 shadow-sm ring-1 ring-slate-100">
              <Image src="/logo.jpeg" alt="" fill sizes="80px" className="object-cover object-top scale-[2] origin-top" />
            </div>
            <div className="leading-none">
              <div className="text-[16px] font-extrabold tracking-tight text-[#1B3A8A]">Edu<span className="text-[#0D9E92]">Bridge</span></div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 mt-0.5">Educational Solutions</div>
            </div>
          </Link>
        </div>

        <div className="px-3 py-2 border-b border-slate-100">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#E8722A] px-2">Teacher Portal</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-[#E8722A]/8 text-[#E8722A]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                {label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E8722A]" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#E8722A] to-[#d4641e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400">Teacher</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
