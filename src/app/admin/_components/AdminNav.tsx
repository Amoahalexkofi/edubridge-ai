"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Link2, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users",    label: "Users",     icon: Users           },
  { href: "/admin/subjects", label: "Subjects",  icon: BookOpen        },
  { href: "/admin/links",    label: "Parent links", icon: Link2        },
  { href: "/admin/settings", label: "Settings",  icon: Settings        },
];

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
        <Link href="/admin" className="flex items-center gap-2 shrink-0">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl flex-shrink-0 shadow-sm ring-1 ring-slate-100">
            <Image src="/logo.jpeg" alt="" fill sizes="72px" className="object-cover object-top scale-[2] origin-top" />
          </div>
          <div className="leading-none">
            <div className="text-[14px] font-extrabold tracking-tight text-[#1B3A8A]">Edu<span className="text-[#0D9E92]">Bridge</span></div>
            <div className="text-[7.5px] font-semibold uppercase tracking-[0.11em] text-slate-400 mt-0.5">Educational Solutions</div>
          </div>
        </Link>
        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
      </header>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe" style={{ height: "64px" }}>
        {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 rounded-xl ${active ? "text-slate-800" : "text-slate-400"}`}>
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className={`text-[10px] font-semibold ${active ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-slate-900 border-r border-slate-800">
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl flex-shrink-0 ring-1 ring-white/20">
              <Image src="/logo.jpeg" alt="" fill sizes="80px" className="object-cover object-top scale-[2] origin-top" />
            </div>
            <div className="leading-none">
              <div className="text-[16px] font-extrabold tracking-tight text-white">Edu<span className="text-[#2DD4BF]">Bridge</span></div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 mt-0.5">Educational Solutions</div>
            </div>
          </Link>
        </div>
        <div className="px-3 py-2 border-b border-slate-800">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2">Admin Console</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                {label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E8722A]" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-[#E8722A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
