"use client";

// Heavy chat panel: useChat + react-markdown + KaTeX. Loaded lazily (via
// next/dynamic in FloatingTutor) only when a student actually opens the tutor,
// so these ~300KB of libraries don't ship on every student page.

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { Brain, Send, X, Minus, Loader2, Copy, Check, Maximize2, ImagePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Link from "next/link";
import type { Message } from "ai";
import { compressImage } from "@/lib/image-compress";

interface Props {
  userId: string;
  firstName: string;
  examTarget: string;
  onClose: () => void;
}

const STORAGE_KEY = (scope: string) => `edubridge-chat-${scope}`;
const SEEN_KEY = (scope: string) => `edubridge-chat-seen-${scope}`;

function welcomeMsg(firstName: string, examTarget: string): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi ${firstName}! Ask me anything about your ${examTarget} curriculum and I'll explain it step by step. 🎯`,
  };
}

function loadMessages(scope: string, examTarget: string, firstName: string): Message[] {
  if (typeof window === "undefined") return [welcomeMsg(firstName, examTarget)];
  try {
    const saved = localStorage.getItem(STORAGE_KEY(scope));
    if (saved) {
      const parsed = JSON.parse(saved) as Message[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [welcomeMsg(firstName, examTarget)];
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#F1F0EC] text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function TutorPanel({ userId, firstName, examTarget, onClose }: Props) {
  const [minimised, setMinimised] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [savedMessages] = useState<Message[]>(() => loadMessages(userId, examTarget, firstName));

  const { messages, input, setInput, handleSubmit, isLoading, stop } = useChat({
    api: "/api/student/ai-tutor",
    body: { examTarget, firstName },
    initialMessages: savedMessages,
  });

  // Photo of the student's working, attached to the next message.
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [attaching, setAttaching] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  async function pickImage(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    setAttaching(true);
    try {
      setAttachment({ url: await compressImage(file), name: file.name || "photo.jpg" });
    } catch {
      /* retry */
    } finally {
      setAttaching(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  }

  function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !attachment) return;
    handleSubmit(e, attachment
      ? { experimental_attachments: [{ name: attachment.name, contentType: "image/jpeg", url: attachment.url }] }
      : undefined);
    setAttachment(null);
  }

  // Persist chat + mark everything seen (the panel is open by definition here).
  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(messages)); } catch {}
    }
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    if (!minimised) {
      try { localStorage.setItem(SEEN_KEY(userId), String(assistantCount)); } catch {}
    }
  }, [messages, minimised, userId]);

  useEffect(() => {
    if (!minimised) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, minimised]);

  useEffect(() => {
    if (!minimised) setTimeout(() => inputRef.current?.focus(), 100);
  }, [minimised]);

  return (
    <>
      <div className={`fixed z-50 bottom-20 right-4 lg:bottom-6 lg:right-6 w-[calc(100vw-2rem)] sm:w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-[#E6E4DE] flex flex-col transition-all duration-200 ${
        minimised ? "h-[56px] overflow-hidden" : "h-[560px] sm:h-[600px] max-h-[calc(100dvh-6rem)]"
      }`}>

        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E6E4DE] bg-gradient-to-r from-[#1B3A8A] to-[#1D4ED8] rounded-t-2xl flex-shrink-0">
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white leading-tight">EduBridge AI Tutor</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              <span className="text-[10px] text-white/70">{examTarget} aligned · Always on</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/student/ai-tutor" title="Open full screen" className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => setMinimised(!minimised)} title={minimised ? "Restore" : "Minimise"} className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} title="Close" className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[#F8F7F4]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 eb-msg-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Brain className="h-3 w-3 text-white" />
                </div>
              )}
              {msg.role === "user" ? (
                <div className="max-w-[78%] bg-[#1B3A8A] text-white px-3 py-2 rounded-xl rounded-br-sm text-[13px] leading-relaxed">
                  {msg.experimental_attachments?.filter((a) => a.contentType?.startsWith("image/")).map((a, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={a.url} alt="Your working" className="mb-1.5 rounded-lg max-h-44 w-auto" />
                  ))}
                  {msg.content}
                </div>
              ) : (
                <div className="group flex items-start gap-1 flex-1">
                  <div className="flex-1 bg-white border border-[#E6E4DE] rounded-xl rounded-bl-sm px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="prose prose-xs max-w-none text-[#334155]
                      prose-p:my-1 prose-p:text-[13px] prose-p:leading-relaxed
                      prose-headings:text-[#1B3A8A] prose-headings:font-bold
                      prose-h3:text-[13px] prose-h3:mt-3 prose-h3:mb-1
                      prose-strong:text-[#0f172a] prose-strong:font-semibold
                      prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-li:text-[13px]
                      prose-code:bg-[#EEF2FF] prose-code:text-[#1B3A8A] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:before:content-none prose-code:after:content-none
                      prose-hr:my-2 prose-hr:border-[#E6E4DE]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          table: ({ children }) => (
                            <div className="not-prose my-2 overflow-x-auto rounded-lg border border-[#E6E4DE]">
                              <table className="w-full text-[12px] border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-[#EEF2FF]">{children}</thead>,
                          th: ({ children }) => (
                            <th className="text-left px-2.5 py-1.5 font-bold text-[#1B3A8A] text-[10px] uppercase tracking-wide border-b border-[#C7D2FE] whitespace-nowrap">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="px-2.5 py-1.5 text-[#334155] border-b border-[#EEEDE8] align-top">{children}</td>
                          ),
                          tr: ({ children }) => <tr className="even:bg-[#FAFBFF]">{children}</tr>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <CopyBtn text={msg.content} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <div className="bg-white border border-[#E6E4DE] rounded-xl rounded-bl-sm px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1B3A8A]/30 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1B3A8A]/30 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1B3A8A]/30 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-3 py-3 bg-white border-t border-[#E6E4DE] rounded-b-2xl">
          {attachment && (
            <div className="mb-2 inline-flex items-center gap-2 bg-[#F2F1EE] border border-[#E6E4DE] rounded-lg p-1 pr-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.url} alt="Your working" className="h-9 w-9 rounded-md object-cover" />
              <span className="text-[11px] text-[#64748B]">Photo attached</span>
              <button onClick={() => setAttachment(null)} className="h-5 w-5 rounded text-slate-400 hover:text-red-500 flex items-center justify-center" aria-label="Remove photo">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0] ?? null)} />
          <form onSubmit={submitMessage} className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              disabled={attaching}
              title="Attach a photo of your working"
              className="h-10 w-10 rounded-xl bg-[#F2F1EE] hover:bg-[#EEEDE8] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-60"
            >
              {attaching ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" /> : <ImagePlus className="h-4 w-4 text-[#64748B]" />}
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() || attachment) submitMessage(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Ask anything…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#E6E4DE] bg-[#F8F7F4] px-3 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1B3A8A] focus:bg-white transition-all leading-relaxed max-h-24 overflow-y-auto"
              style={{ minHeight: "40px" }}
            />
            {isLoading ? (
              <button type="button" onClick={stop} className="h-10 w-10 rounded-xl bg-[#F2F1EE] flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim() && !attachment} className="h-10 w-10 rounded-xl bg-[#1B3A8A] hover:bg-[#162f74] disabled:opacity-35 flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm">
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Mobile quick-dismiss */}
      <button
        onClick={onClose}
        title="Close"
        className="fixed z-40 bottom-20 right-4 lg:bottom-6 lg:right-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] text-white shadow-[0_8px_28px_rgba(27,58,138,0.45)] flex items-center justify-center transition-all active:scale-95 lg:hidden"
      >
        <X className="h-5 w-5" />
      </button>
    </>
  );
}
