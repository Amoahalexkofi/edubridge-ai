"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Sign-out usable anywhere (added to the profile page so mobile students —
// who have no sidebar — can actually log out). Mirrors the sidebar's handler:
// clears cached AI-tutor chats from this browser for shared-device privacy.
export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("edubridge-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className={className ?? "w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-[#E6E4DE] text-sm font-semibold text-[#DC2626] hover:bg-red-50 hover:border-red-200 transition-colors"}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}
