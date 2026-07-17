"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2, Upload, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import LessonEditor from "@/app/teacher/lessons/new/_components/LessonEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopicOpt = { id: string; title: string; order_index: number; subject_id: string; subjects: any };

interface Props {
  topicId: string;
  allTopics: TopicOpt[];
  onSaved: (keepOpen?: boolean) => void;
}

export default function LessonImporter({ topicId, allTopics, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [raw, setRaw] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);

  async function runExtract(init: RequestInit) {
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/import-lesson", { method: "POST", ...init });
      // The response may be a non-JSON error page (e.g. a timeout) — read defensively.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;
      try { data = await res.json(); } catch { /* not JSON */ }
      if (!res.ok) {
        toast.error(data?.error ?? `The import didn't complete (${res.status}). Try a shorter file, or paste the text.`);
        return;
      }
      if (!data?.content) {
        toast.error("Couldn't turn that into a lesson. Try pasting the text instead.");
        return;
      }
      setResult({ title: data.title ?? "", content: data.content });
      toast.success("Lesson drafted — review and save.");
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
      setExtracting(false);
    }
  }

  function extractText() {
    if (raw.trim().length < 20) { toast.error("Paste some lesson text first."); return; }
    runExtract({ headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawText: raw }) });
  }
  function extractFile() {
    if (!file) { toast.error("Choose a PDF or Word file first."); return; }
    const form = new FormData();
    form.append("file", file);
    runExtract({ body: form });
  }
  function pickFile(f: File | null) {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) { toast.error("Please choose a PDF or Word (.docx) file."); return; }
    if (f.size > 4.4 * 1024 * 1024) { toast.error("That file is too large — keep it under ~4 MB, or paste the text."); return; }
    setFile(f);
  }

  // ── Review stage: the drafted lesson flows into the real editor ──
  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setResult(null)} className="flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1D4ED8] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to import
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> AI draft — review before saving
          </span>
        </div>
        <p className="text-xs text-[#64748B]">
          Check the formatting, fix anything, add diagrams where marked, then save. Nothing is stored until you click save.
        </p>
        <LessonEditor
          topics={allTopics}
          preselectedTopicId={topicId}
          initialTitle={result.title}
          initialContent={result.content}
          onSaved={onSaved}
        />
      </div>
    );
  }

  // ── Input stage ──
  return (
    <div className="space-y-4">
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-[#1D4ED8] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#1e40af] leading-relaxed">
          <p className="font-bold mb-0.5">Turn existing material into a lesson.</p>
          <p>Upload a lesson (PDF or Word) or paste its text. The AI cleans it up into properly formatted lesson content — headings, bullet points, tables — and drafts a title. You review and edit before it&apos;s saved.</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-[#F2F1EE] rounded-xl">
        {(["upload", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${
              mode === m ? "bg-white text-[#1D4ED8] shadow-sm" : "text-[#64748B] hover:text-slate-900"
            }`}
          >
            {m === "upload" ? "Upload file" : "Paste text"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
            className="cursor-pointer border-2 border-dashed border-[#CBD5E1] hover:border-[#1D4ED8] hover:bg-[#F8FAFF] rounded-xl p-8 text-center transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2.5">
                <FileText className="h-6 w-6 text-[#1D4ED8] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-[#94a3b8]">{(file.size / 1024 / 1024).toFixed(1)} MB · click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-11 w-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <Upload className="h-5 w-5 text-[#1D4ED8]" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Drop a PDF or Word file here, or click to browse</p>
                <p className="text-xs text-[#94a3b8]">One lesson at a time. Up to ~4 MB.</p>
              </div>
            )}
          </div>
          <button
            onClick={extractFile}
            disabled={extracting || !file}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm"
          >
            {extracting ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting lesson…</> : <><Sparkles className="h-4 w-4" /> Draft lesson</>}
          </button>
        </>
      ) : (
        <>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"Paste the lesson material here — notes, a textbook section, a handout…"}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-white text-slate-800 text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 resize-none"
          />
          <button
            onClick={extractText}
            disabled={extracting || raw.trim().length < 20}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm"
          >
            {extracting ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting lesson…</> : <><Sparkles className="h-4 w-4" /> Draft lesson</>}
          </button>
        </>
      )}
      <p className="text-center text-xs text-[#94a3b8]">You&apos;ll review and edit the draft before anything is saved.</p>
    </div>
  );
}
