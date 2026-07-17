"use client";

// Lightweight launcher. The heavy chat panel (useChat + markdown + KaTeX, ~300KB)
// is code-split and only fetched when a student opens the tutor — so it no longer
// weighs down every student page on slow mobile connections.

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Brain } from "lucide-react";

const TutorPanel = dynamic(() => import("./TutorPanel"), { ssr: false });

const STORAGE_KEY = (scope: string) => `edubridge-chat-${scope}`;
const SEEN_KEY = (scope: string) => `edubridge-chat-seen-${scope}`;

interface Props {
  userId: string;
  firstName: string;
  examTarget: string;
}

export default function FloatingTutor({ userId, firstName, examTarget }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Compute unread purely from localStorage — no chat libraries needed for the badge.
  useEffect(() => {
    function computeUnread() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY(userId));
        if (!saved) { setUnread(0); return; }
        const msgs = JSON.parse(saved);
        const assistantCount = Array.isArray(msgs) ? msgs.filter((m: { role?: string }) => m.role === "assistant").length : 0;
        const seenRaw = localStorage.getItem(SEEN_KEY(userId));
        const seen = seenRaw != null ? parseInt(seenRaw, 10) : assistantCount;
        setUnread(Math.max(0, assistantCount - seen));
      } catch { setUnread(0); }
    }
    computeUnread();
    window.addEventListener("focus", computeUnread);
    return () => window.removeEventListener("focus", computeUnread);
  }, [userId]);

  // Hide on the AI Tutor page itself
  if (pathname === "/student/ai-tutor") return null;

  return (
    <>
      {open && (
        <TutorPanel userId={userId} firstName={firstName} examTarget={examTarget} onClose={() => { setOpen(false); setUnread(0); }} />
      )}

      {!open && (
        <button
          onClick={() => { setOpen(true); setUnread(0); }}
          title="Ask the AI Tutor"
          className="group fixed z-50 bottom-20 right-4 lg:bottom-6 lg:right-6 flex items-center h-14 w-14 sm:w-auto justify-center sm:justify-start rounded-full sm:gap-3 sm:pl-4 sm:pr-5 bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] text-white shadow-[0_8px_28px_rgba(27,58,138,0.45)] hover:shadow-[0_14px_40px_rgba(27,58,138,0.55)] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <span className="relative flex items-center justify-center flex-shrink-0">
            {unread > 0 && <span className="absolute inline-flex h-9 w-9 rounded-full bg-white/20 animate-ping" />}
            <Brain className="relative h-6 w-6" />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-none">
            <span className="font-bold text-sm">Ask AI Tutor</span>
            <span className="text-[10px] text-white/75 mt-1 flex items-center gap-1">
              {unread > 0
                ? <><span className="h-1.5 w-1.5 rounded-full bg-[#E8722A]" /> {unread} new {unread === 1 ? "reply" : "replies"}</>
                : <><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" /> Online · {examTarget}</>}
            </span>
          </span>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8722A] text-[10px] font-black text-white flex items-center justify-center border-2 border-white shadow-sm">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
    </>
  );
}
