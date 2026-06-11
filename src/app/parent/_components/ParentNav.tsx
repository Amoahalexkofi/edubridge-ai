"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, TrendingUp, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/parent",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/progress", label: "Progress",  icon: TrendingUp     },
  { href: "/parent/profile",  label: "Profile",   icon: User           },
];

export default function ParentNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/parent") return pathname === "/parent";
    return pathname.startsWith(href);
  }

  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
        <Link href="/parent">
          <Image src="/logo.jpeg" alt="EduBridge AI" width={110} height={68} className="h-8 w-auto object-contain" />
        </Link>
        <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
      </header>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe" style={{ height: "64px" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 rounded-xl ${active ? "text-green-600" : "text-slate-400"}`}>
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className={`text-[10px] font-semibold ${active ? "text-green-600" : "text-slate-400"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-slate-100">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Image src="/logo.jpeg" alt="EduBridge AI" width={130} height={88} className="h-9 w-auto object-contain" />
        </div>
        <div className="px-3 py-2 border-b border-slate-100">
          <span className="text-[10px] font-bold tracking-widest uppercase text-green-600 px-2">Parent Portal</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-green-50 text-green-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                {label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400">Parent / Guardian</p>
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
