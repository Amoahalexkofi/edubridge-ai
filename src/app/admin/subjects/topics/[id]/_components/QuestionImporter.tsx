"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2, Trash2, Save, AlertTriangle, ArrowLeft, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const LETTERS = "abcdefghij";

interface EditableQ {
  key: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  confidence: "high" | "low";
}

interface RawQ {
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  confidence: "high" | "low";
}

interface Props {
  topicId: string;
  /** keepOpen unused here; kept signature-compatible with the editors' onSaved */
  onSaved: (keepOpen?: boolean) => void;
}

export default function QuestionImporter({ topicId, onSaved }: Props) {
  const keyRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [raw, setRaw] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [items, setItems] = useState<EditableQ[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function runExtract(init: RequestInit) {
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/import-questions", { method: "POST", ...init });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Extraction failed."); return; }
      const parsed: EditableQ[] = (data.questions as RawQ[]).map((q) => ({
        key: keyRef.current++,
        prompt: q.prompt ?? "",
        options: q.options ?? [],
        correctIndex: Math.min(Math.max(q.correct_index ?? 0, 0), (q.options?.length ?? 1) - 1),
        explanation: q.explanation ?? "",
        difficulty: q.difficulty ?? "medium",
        confidence: q.confidence ?? "low",
      }));
      if (parsed.length === 0) { toast.error("No questions found in that material."); return; }
      setItems(parsed);
      toast.success(`Found ${parsed.length} question${parsed.length === 1 ? "" : "s"}. Review and save.`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setExtracting(false);
    }
  }

  function extractText() {
    if (raw.trim().length < 20) { toast.error("Paste some question text first."); return; }
    runExtract({
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: raw }),
    });
  }

  function extractFile() {
    if (!file) { toast.error("Choose a PDF or Word file first."); return; }
    const form = new FormData();
    form.append("file", file);
    runExtract({ body: form }); // browser sets the multipart Content-Type + boundary
  }

  function pickFile(f: File | null) {
    if (!f) return;
    const name = f.name.toLowerCase();
    const ok = name.endsWith(".pdf") || name.endsWith(".docx");
    if (!ok) { toast.error("Please choose a PDF or Word (.docx) file."); return; }
    if (f.size > 4.4 * 1024 * 1024) { toast.error("That file is too large — keep it under ~4 MB. For a big scanned paper, split it or paste the text."); return; }
    setFile(f);
  }

  function update(key: number, patch: Partial<EditableQ>) {
    setItems((prev) => prev!.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }
  function setOption(key: number, idx: number, text: string) {
    setItems((prev) => prev!.map((q) => q.key === key ? { ...q, options: q.options.map((o, i) => i === idx ? text : o) } : q));
  }
  function remove(key: number) {
    setItems((prev) => prev!.filter((q) => q.key !== key));
  }

  async function saveAll() {
    if (!items || items.length === 0) return;
    for (const q of items) {
      if (!q.prompt.trim()) { toast.error("Every question needs a prompt."); return; }
      if (q.options.some((o) => !o.trim())) { toast.error("Every option needs text. Fix or remove blanks."); return; }
    }
    setSaving(true);
    const payload = items.map((q) => ({
      topic_id: topicId,
      prompt: q.prompt.trim(),
      options: q.options.map((text, i) => ({ id: LETTERS[i], text: text.trim() })),
      correct_answer: LETTERS[q.correctIndex],
      explanation: q.explanation.trim() || null,
      difficulty: q.difficulty,
    }));
    const { error } = await createClient().from("questions").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Saved ${payload.length} question${payload.length === 1 ? "" : "s"}!`);
    onSaved(false);
  }

  const lowConf = items?.filter((q) => q.confidence === "low").length ?? 0;

  // ── Review stage ──
  if (items) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setItems(null)} className="flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1D4ED8] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to paste
          </button>
          <span className="text-sm font-bold text-slate-900">{items.length} question{items.length === 1 ? "" : "s"}</span>
        </div>

        {lowConf > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              <b>{lowConf}</b> answer{lowConf === 1 ? " was" : "s were"} worked out by AI (no answer key found) — the green mark shows the picked answer. Please double-check the ones flagged <b>Review</b> before saving.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((q, qi) => (
            <div key={q.key} className="bg-white rounded-xl border border-[#E6E4DE] eb-card p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-md bg-[#F2F1EE] text-[#64748B] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{qi + 1}</span>
                <textarea
                  value={q.prompt}
                  onChange={(e) => update(q.key, { prompt: e.target.value })}
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E6E4DE] bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 resize-none"
                />
                {q.confidence === "low" ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Review</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">Keyed</span>
                )}
                <button onClick={() => remove(q.key)} className="h-7 w-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center flex-shrink-0" aria-label="Remove question">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 pl-8">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => update(q.key, { correctIndex: oi })}
                      className={`h-7 w-7 rounded-full border-2 text-[11px] font-bold flex-shrink-0 transition-all ${
                        q.correctIndex === oi ? "border-green-400 bg-green-400 text-white" : "border-[#E6E4DE] text-[#94a3b8] hover:border-green-400/50"
                      }`}
                    >
                      {LETTERS[oi].toUpperCase()}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => setOption(q.key, oi, e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#E6E4DE] bg-white text-sm text-slate-700 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pl-8">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update(q.key, { difficulty: d })}
                    className={`h-7 px-3 rounded-lg border text-[11px] font-bold capitalize transition-all ${
                      q.difficulty === d ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-[#E6E4DE] text-[#94a3b8] hover:border-slate-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-[#F4F3EF]/90 backdrop-blur border-t border-[#E6E4DE] flex items-center gap-3">
          <button onClick={() => setItems(null)} className="text-sm font-semibold text-[#64748B] hover:text-slate-900">Cancel</button>
          <button
            onClick={saveAll}
            disabled={saving || items.length === 0}
            className="ml-auto flex items-center gap-2 h-11 px-6 rounded-xl bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold transition-all disabled:opacity-60 text-sm shadow-[0_4px_14px_rgba(232,114,42,0.3)]"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save all {items.length}</>}
          </button>
        </div>
      </div>
    );
  }

  // ── Input stage (upload or paste) ──
  return (
    <div className="space-y-4">
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-[#1D4ED8] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#1e40af] leading-relaxed">
          <p className="font-bold mb-0.5">Import a whole past paper at once.</p>
          <p>Upload the paper (PDF or Word) or paste its text. Include the answer key / marking scheme if you have it — the AI uses it to set the correct answers. No key? It works them out itself and flags each one for you to check.</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-[#F2F1EE] rounded-xl">
        {(["upload", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 h-9 rounded-lg text-sm font-bold capitalize transition-all ${
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
                <p className="text-xs text-[#94a3b8]">PDF works best — it reads scanned pages and diagrams too. Up to ~4 MB.</p>
              </div>
            )}
          </div>

          <button
            onClick={extractFile}
            disabled={extracting || !file}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm"
          >
            {extracting ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading with AI…</> : <><Sparkles className="h-4 w-4" /> Extract questions</>}
          </button>
        </>
      ) : (
        <>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Paste your questions here, for example:\n\n1. The capital of Ghana is\n   A. Kumasi  B. Accra  C. Tamale  D. Cape Coast\n\n2. Water boils at ___ °C at sea level.\n   A. 50  B. 90  C. 100  D. 120\n\nAnswers: 1. B  2. C`}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-white text-slate-800 text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 resize-none font-mono"
          />
          <button
            onClick={extractText}
            disabled={extracting || raw.trim().length < 20}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm"
          >
            {extracting ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading with AI…</> : <><Sparkles className="h-4 w-4" /> Extract questions</>}
          </button>
        </>
      )}
      <p className="text-center text-xs text-[#94a3b8]">You&apos;ll review everything before anything is saved.</p>
    </div>
  );
}
