"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import {
  Brain, Send, Loader2, Copy, Check, Zap,
  Plus, MessageSquare, BarChart2, X, Menu, AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { Message } from "ai";
import type { ExamContext } from "../page";
import { createClient } from "@/lib/supabase/client";

export interface ChatSession {
  id: string;
  title: string;
  type: "exam" | "general";
  examContext?: ExamContext;
  messages: Message[];
  createdAt: string;
}

interface Props {
  userId: string;
  firstName: string;
  examTarget: "BECE" | "WASSCE";
  examContext?: ExamContext;
  /** Chat history loaded from the database (source of truth across devices/logins). */
  initialSessions?: ChatSession[];
}

// Keys are scoped by user id so chats never leak between accounts on a shared browser.
const SESSIONS_KEY = (scope: string) => `edubridge-sessions-${scope}`;
const ACTIVE_KEY   = (scope: string) => `edubridge-active-${scope}`;
const MAX_SESSIONS = 20;

const STARTERS: Record<"BECE" | "WASSCE", string[]> = {
  BECE: [
    "Explain how to find the LCM and HCF of numbers",
    "How does photosynthesis work?",
    "What are the causes of Ghana's independence movement?",
    "Help me understand algebraic expressions",
    "Difference between elements, compounds and mixtures?",
    "Explain the water cycle step by step",
  ],
  WASSCE: [
    "Differentiate x³ + 5x² − 2x + 7 for me",
    "Explain demand and supply with a diagram",
    "How do I solve quadratic equations by completing the square?",
    "What is the structure of DNA and how does it replicate?",
    "Explain Newton's three laws of motion",
    "What are the properties of acids and bases?",
  ],
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function welcomeMessage(firstName: string, examTarget: string): Message {
  return {
    id: "welcome-" + genId(),
    role: "assistant",
    content: `Hi ${firstName}! I'm your EduBridge AI Tutor, here to help you ace your ${examTarget}. 🎯\n\nAsk me anything — a concept you don't understand, a maths problem you're stuck on, or a topic you want explained differently. I'm here 24/7.\n\nWhat would you like to learn today?`,
  };
}

function createSession(
  title: string,
  type: "exam" | "general",
  firstName: string,
  examTarget: string,
  examContext?: ExamContext,
): ChatSession {
  return { id: genId(), title, type, examContext, messages: [welcomeMessage(firstName, examTarget)], createdAt: new Date().toISOString() };
}

function loadState(scope: string, examTarget: string, firstName: string, incomingCtx?: ExamContext, dbSessions?: ChatSession[]) {
  if (typeof window === "undefined") {
    const s = dbSessions?.[0] ?? createSession("General", "general", firstName, examTarget);
    return { sessions: dbSessions?.length ? dbSessions : [s], activeId: s.id };
  }
  // Database is the source of truth (survives sign-out and follows the account
  // across devices); localStorage is only a fallback for chats from before
  // server-side history existed.
  let sessions: ChatSession[] = dbSessions?.length ? dbSessions : [];
  if (sessions.length === 0) {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY(scope));
      if (raw) sessions = JSON.parse(raw) as ChatSession[];
    } catch {}
  }
  if (!Array.isArray(sessions) || sessions.length === 0) {
    const s = createSession("General", "general", firstName, examTarget);
    sessions = [s];
  }
  if (incomingCtx) {
    const existing = sessions.find(s => s.type === "exam" && s.examContext?.subject === incomingCtx.subject && s.examContext?.score === incomingCtx.score);
    if (existing) return { sessions, activeId: existing.id };
    const es = createSession(`${incomingCtx.subject} (${incomingCtx.score}%)`, "exam", firstName, examTarget, incomingCtx);
    sessions = [es, ...sessions].slice(0, MAX_SESSIONS);
    return { sessions, activeId: es.id };
  }
  const saved = localStorage.getItem(ACTIVE_KEY(scope));
  const activeId = saved && sessions.find(s => s.id === saved) ? saved : sessions[0].id;
  return { sessions, activeId };
}

function saveSessions(scope: string, sessions: ChatSession[]) {
  try { localStorage.setItem(SESSIONS_KEY(scope), JSON.stringify(sessions)); } catch {}
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      title="Copy"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#94a3b8] hover:text-[#475569] flex-shrink-0"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#1A6B3C]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function AIChatClient({ userId, firstName, examTarget, examContext, initialSessions }: Props) {
  const bottomRef    = useRef<HTMLDivElement>(null);
  const hasAutoSent  = useRef(false);
  const activeIdRef  = useRef("");
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef  = useRef<ReturnType<typeof createClient> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [{ sessions, activeId }, setSessionState] = useState(() => loadState(userId, examTarget, firstName, examContext, initialSessions));
  activeIdRef.current = activeId;

  function db() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  function upsertSessionToDb(session: ChatSession) {
    db()
      .from("ai_chat_sessions")
      .upsert({
        id: session.id,
        user_id: userId,
        title: session.title,
        type: session.type,
        exam_context: session.examContext ?? null,
        messages: session.messages,
        created_at: session.createdAt,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("[ai-tutor] failed to save chat:", error.message);
      });
  }

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0];

  const { messages, input, setInput, setMessages, handleSubmit, append, isLoading, error, stop } = useChat({
    api: "/api/student/ai-tutor",
    body: { examTarget, firstName },
    initialMessages: activeSession?.messages ?? [],
  });

  // Persist messages into the active session (localStorage immediately,
  // database debounced so we don't write on every streamed token)
  useEffect(() => {
    if (messages.length === 0) return;
    const cid = activeIdRef.current;
    setSessionState(prev => {
      const updated = prev.sessions.map(s => s.id === cid ? { ...s, messages } : s);
      saveSessions(userId, updated);
      return { ...prev, sessions: updated };
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const meta = sessions.find(s => s.id === cid);
      if (meta) upsertSessionToDb({ ...meta, messages });
    }, 1200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Auto-send for new exam sessions
  useEffect(() => {
    if (!examContext || hasAutoSent.current || isLoading || messages.length > 1) return;
    hasAutoSent.current = true;
    const msg = examContext.weakTopics.length > 0
      ? `I just finished my ${examContext.subject} exam and scored ${examContext.score}% (${examContext.correct} out of ${examContext.total} correct). My weakest topics were: ${examContext.weakTopics.join(", ")}. Please teach me these topics step by step — start with the one I need the most help with.`
      : `I just finished my ${examContext.subject} exam and scored ${examContext.score}% (${examContext.correct} out of ${examContext.total} correct). Can you help me understand where I went wrong and how to improve?`;
    const t = setTimeout(() => append({ role: "user", content: msg }), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examContext, activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function switchSession(id: string) {
    if (id === activeId) { setSidebarOpen(false); return; }
    stop();
    const target = sessions.find(s => s.id === id);
    if (!target) return;
    activeIdRef.current = id;
    setSessionState(prev => ({ ...prev, activeId: id }));
    setMessages(target.messages);
    try { localStorage.setItem(ACTIVE_KEY(userId), id); } catch {}
    setSidebarOpen(false);
  }

  function newGeneralChat() {
    stop();
    const count = sessions.filter(s => s.type === "general").length;
    const title = count === 0 ? "General" : `New Chat ${count + 1}`;
    const s = createSession(title, "general", firstName, examTarget);
    activeIdRef.current = s.id;
    upsertSessionToDb(s);
    setSessionState(prev => {
      const updated = [s, ...prev.sessions].slice(0, MAX_SESSIONS);
      saveSessions(userId, updated);
      return { sessions: updated, activeId: s.id };
    });
    setMessages(s.messages);
    hasAutoSent.current = false;
    try { localStorage.setItem(ACTIVE_KEY(userId), s.id); } catch {}
    setSidebarOpen(false);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    db()
      .from("ai_chat_sessions")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("[ai-tutor] failed to delete chat:", error.message);
      });
    setSessionState(prev => {
      let updated = prev.sessions.filter(s => s.id !== id);
      if (updated.length === 0) {
        const fb = createSession("General", "general", firstName, examTarget);
        updated = [fb];
      }
      const newActive = id === prev.activeId ? updated[0].id : prev.activeId;
      saveSessions(userId, updated);
      if (id === prev.activeId) {
        activeIdRef.current = newActive;
        setMessages(updated.find(s => s.id === newActive)?.messages ?? []);
        try { localStorage.setItem(ACTIVE_KEY(userId), newActive); } catch {}
      }
      return { sessions: updated, activeId: newActive };
    });
  }

  function handleStarter(text: string) {
    setInput(text);
    setTimeout(() => (document.getElementById("chat-form") as HTMLFormElement)?.requestSubmit(), 0);
  }

  const showStarters    = messages.length <= 1 && activeSession?.type !== "exam";
  const currentExamCtx  = activeSession?.examContext;

  // Header subtitle — changes based on active session
  const headerSubtitle = currentExamCtx
    ? `${currentExamCtx.subject} exam · ${currentExamCtx.score}% score`
    : `${examTarget} aligned · Always available`;

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "" : ""}`}>
      {/* Top */}
      <div className="p-3 pb-2">
        {mobile && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#0f172a]">Chats</p>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-[#64748B]">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <button
          onClick={newGeneralChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1B3A8A] hover:bg-[#162f74] text-white text-[13px] font-semibold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          New chat
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {sessions.length > 0 && (
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest px-2 pt-2 pb-1.5">
            Recents
          </p>
        )}
        {sessions.map(s => {
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => switchSession(s.id)}
              className={`group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                isActive ? "bg-[#EEF2FF]" : "hover:bg-[#F1F5F9]"
              }`}
            >
              <div className={`flex-shrink-0 ${isActive ? "text-[#1B3A8A]" : s.type === "exam" ? "text-[#6366F1]" : "text-[#94a3b8]"}`}>
                {s.type === "exam" ? <BarChart2 className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
              </div>
              <p className={`flex-1 text-[13px] truncate ${isActive ? "font-semibold text-[#1B3A8A]" : "font-normal text-[#334155]"}`}>
                {s.title}
              </p>
              {/* Always visible on touch (no hover); hover-reveal on desktop.
                  Larger hit area so chats are actually deletable on a phone. */}
              <button
                onClick={e => deleteSession(s.id, e)}
                aria-label={`Delete chat: ${s.title}`}
                className="flex-shrink-0 -mr-1 p-2 rounded-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#DC2626] hover:bg-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    // Mobile: layout wrapper adds pt-14 (56px) + pb-20 (80px) = 8.5rem; use dvh
    // so the composer never hides behind the browser toolbar or bottom tab bar.
    <div className="flex h-[calc(100dvh-8.5rem)] lg:h-screen">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 bg-[#F8FAFC] border-r border-[#E2E8F0]">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-[#F8FAFC] flex flex-col border-r border-[#E2E8F0] shadow-2xl">
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#E2E8F0] bg-white">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center shadow-sm">
                  <Brain className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#1A6B3C] border-2 border-white" />
              </div>

              {/* Title + subtitle */}
              <div className="min-w-0">
                <p className="font-bold text-[14px] text-[#0f172a] leading-tight">EduBridge AI Tutor</p>
                <p className={`text-[11px] truncate leading-tight ${currentExamCtx ? "text-[#6366F1] font-medium" : "text-[#64748B]"}`}>
                  {headerSubtitle}
                </p>
              </div>

              {/* Weak topic pills (exam sessions) */}
              {currentExamCtx && currentExamCtx.weakTopics.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 ml-1">
                  <AlertTriangle className="h-3 w-3 text-[#D97706] flex-shrink-0" />
                  {currentExamCtx.weakTopics.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                      {t}
                    </span>
                  ))}
                  {currentExamCtx.weakTopics.length > 3 && (
                    <span className="text-[10px] text-[#94a3b8]">+{currentExamCtx.weakTopics.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {/* Online pill */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1A6B3C] bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#BBF7D0] flex-shrink-0">
              <Zap className="h-3 w-3" /> Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">

            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const isFirstInGroup = !prev || prev.role !== msg.role;
              const isLastInGroup  = !messages[i + 1] || messages[i + 1].role !== msg.role;

              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className={`max-w-[68%] bg-[#1B3A8A] text-white px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isFirstInGroup ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-r-md"
                    } ${isLastInGroup ? "" : "mb-0.5"}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // Assistant message
              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isLastInGroup ? "" : "mb-0.5"}`}>
                  {/* Avatar — only on last in group */}
                  <div className="flex-shrink-0 w-8">
                    {isLastInGroup ? (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center shadow-sm">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    ) : null}
                  </div>

                  <div className="group flex items-end gap-1.5 flex-1">
                    <div className={`flex-1 bg-white px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8ECF0] ${
                      isFirstInGroup ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-l-md"
                    }`}>
                      <div className="prose prose-sm max-w-none text-[#1e293b]
                        prose-p:my-1.5 prose-p:leading-relaxed prose-p:text-[#1e293b]
                        prose-headings:font-bold prose-headings:text-[#1B3A8A]
                        prose-h3:text-[14px] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:pb-1.5 prose-h3:border-b prose-h3:border-[#EEF2FF]
                        prose-h4:text-[13px] prose-h4:mt-3 prose-h4:mb-1 prose-h4:text-[#334155]
                        prose-strong:text-[#0f172a] prose-strong:font-semibold
                        prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:leading-relaxed prose-li:text-[#334155]
                        prose-hr:border-[#E2E8F0] prose-hr:my-3
                        prose-code:bg-[#EEF2FF] prose-code:text-[#4338CA] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[11px] prose-code:font-mono prose-code:font-semibold prose-code:before:content-none prose-code:after:content-none
                        prose-blockquote:border-l-[3px] prose-blockquote:border-[#0D9488] prose-blockquote:bg-[#F0FDFA] prose-blockquote:rounded-r-xl prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            // Comparison tables (soil types, cell parts, etc.)
                            table({ children }) {
                              return (
                                <div className="not-prose my-3 overflow-x-auto rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                  <table className="w-full text-[13px] border-collapse">{children}</table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return <thead className="bg-[#EEF2FF]">{children}</thead>;
                            },
                            th({ children }) {
                              return <th className="text-left px-3.5 py-2.5 font-bold text-[#1B3A8A] text-[12px] uppercase tracking-wide border-b border-[#C7D2FE] whitespace-nowrap">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="px-3.5 py-2.5 text-[#334155] border-b border-[#F1F5F9] align-top leading-relaxed">{children}</td>;
                            },
                            tr({ children }) {
                              return <tr className="even:bg-[#FAFBFF]">{children}</tr>;
                            },
                            // Render ```svg blocks as actual SVG diagrams
                            code({ className, children }) {
                              const lang = /language-(\w+)/.exec(className || "")?.[1];
                              if (lang === "svg") {
                                // Add overflow="visible" so labels outside the main shapes aren't clipped,
                                // and set width="100%" so it scales responsively
                                const svgHtml = String(children).trim()
                                  .replace(/<svg([^>]*)>/, (_, attrs) => {
                                    const a = attrs
                                      .replace(/\boverflow="[^"]*"/, "")
                                      .replace(/\bwidth="[^"]*"/, "")
                                      .replace(/\bheight="[^"]*"/, "");
                                    return `<svg${a} width="100%" overflow="visible">`;
                                  });
                                return (
                                  <div className="my-4 not-prose rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 pb-8">
                                    <div dangerouslySetInnerHTML={{ __html: svgHtml }} />
                                  </div>
                                );
                              }
                              return <code className={className}>{children}</code>;
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <CopyButton text={msg.content} />
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2.5">
                <div className="flex-shrink-0 w-8">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center shadow-sm">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="bg-white border border-[#E8ECF0] rounded-2xl rounded-bl-md px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#1B3A8A]/30 animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#1B3A8A]/30 animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#1B3A8A]/30 animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              error.message?.startsWith("Daily limit reached") ? (
                <div className="flex justify-center">
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3 text-sm text-[#92400E] flex items-start gap-2 max-w-md">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#D97706]" />
                    <span>{error.message}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    Something went wrong.
                    <button onClick={() => setMessages([...messages])} className="font-semibold underline">Try again</button>
                  </div>
                </div>
              )
            )}

            {showStarters && (
              <div className="pt-4 pl-10">
                <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3">Try asking…</p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS[examTarget].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStarter(s)}
                      className="text-left text-[13px] text-[#1B3A8A] bg-white border border-[#DBEAFE] hover:border-[#1B3A8A]/40 hover:bg-[#EEF2FF] rounded-full px-4 py-2 transition-all font-medium leading-snug shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 bg-white border-t border-[#E2E8F0] px-4 sm:px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <form id="chat-form" onSubmit={handleSubmit} className="flex items-end gap-2.5">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={activeSession?.type === "exam"
                  ? `Ask about ${activeSession.examContext?.subject ?? "your exam topics"}…`
                  : `Ask your ${examTarget} AI Tutor anything…`}
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1B3A8A]/50 focus:bg-white focus:ring-4 focus:ring-[#1B3A8A]/6 transition-all leading-relaxed max-h-36 overflow-y-auto"
                style={{ minHeight: "48px" }}
              />
              {isLoading ? (
                <button type="button" onClick={stop} className="h-11 w-11 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center flex-shrink-0 transition-colors">
                  <Loader2 className="h-4.5 w-4.5 text-[#64748B] animate-spin" style={{ width: 18, height: 18 }} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-11 w-11 rounded-xl bg-[#1B3A8A] hover:bg-[#162f74] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-[0_2px_8px_rgba(27,58,138,0.25)] hover:shadow-[0_4px_14px_rgba(27,58,138,0.35)] active:scale-95"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              )}
            </form>
            <p className="text-[10px] text-[#CBD5E1] text-center mt-2">
              Enter to send · Shift+Enter for new line · Always verify important facts with your teacher
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
