"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Topic = {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subjects: any;
};

interface OptionItem { id: string; text: string }

const DEFAULT_OPTIONS: OptionItem[] = [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
];

interface Props {
  topics: Topic[];
  preselectedTopicId: string | null;
  questionId?: string;
  initialPrompt?: string;
  initialOptions?: OptionItem[];
  initialCorrect?: string;
  initialExplanation?: string;
  initialDifficulty?: string;
}

export default function QuestionEditor({
  topics,
  preselectedTopicId,
  questionId,
  initialPrompt = "",
  initialOptions = DEFAULT_OPTIONS,
  initialCorrect = "a",
  initialExplanation = "",
  initialDifficulty = "medium",
}: Props) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(preselectedTopicId ?? topics[0]?.id ?? "");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [options, setOptions] = useState<OptionItem[]>(initialOptions);
  const [correct, setCorrect] = useState(initialCorrect);
  const [explanation, setExplanation] = useState(initialExplanation);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [saving, setSaving] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

  function setOption(idx: number, text: string) {
    setOptions((opts) => opts.map((o, i) => i === idx ? { ...o, text } : o));
  }

  function addOption() {
    if (options.length >= 6) return;
    const ids = "abcdefghij";
    setOptions((opts) => [...opts, { id: ids[opts.length], text: "" }]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (!updated.find((o) => o.id === correct)) setCorrect(updated[0].id);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) { toast.error("Question prompt is required."); return; }
    if (options.some((o) => !o.text.trim())) { toast.error("All options must have text."); return; }
    if (!topicId) { toast.error("Please select a topic."); return; }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      topic_id: topicId,
      prompt: prompt.trim(),
      options,
      correct_answer: correct,
      explanation: explanation.trim() || null,
      difficulty,
    };

    if (questionId) {
      const { error } = await supabase.from("questions").update(payload).eq("id", questionId);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Question updated!");
      router.refresh();
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Question added!");
      if (addAnother) {
        setPrompt("");
        setOptions(DEFAULT_OPTIONS);
        setCorrect("a");
        setExplanation("");
      } else {
        router.push("/teacher/questions");
      }
    }
  }

  const inputCls = "w-full h-11 px-4 rounded-xl border border-[#E6E4DE] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all";

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-[0_1px_2px_rgba(31,26,15,0.04),0_6px_20px_-6px_rgba(31,26,15,0.07)] p-5 space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Topic</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} required className={inputCls}>
              <option value="">Select topic…</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.subjects?.name} · {t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 h-11 rounded-xl border-2 text-xs font-bold capitalize transition-all ${
                    difficulty === d
                      ? d === "easy" ? "border-green-400 bg-green-50 text-green-700"
                        : d === "medium" ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-red-400 bg-red-50 text-red-700"
                      : "border-[#E6E4DE] bg-white text-[#64748B] hover:border-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question prompt */}
        <div>
          <label className="block text-sm font-semibold text-[#334155] mb-1.5">Question</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write the question here…"
            required
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-white text-[#334155] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all resize-none"
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-semibold text-[#334155] mb-2">
            Answer options <span className="font-normal text-[#94a3b8]">(mark the correct one)</span>
          </label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(opt.id)}
                  className={`h-8 w-8 rounded-full border-2 text-xs font-bold flex-shrink-0 transition-all ${
                    correct === opt.id
                      ? "border-green-400 bg-green-400 text-white"
                      : "border-[#E6E4DE] text-[#94a3b8] hover:border-green-400/50"
                  }`}
                >
                  {opt.id.toUpperCase()}
                </button>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => setOption(idx, e.target.value)}
                  placeholder={`Option ${opt.id.toUpperCase()}`}
                  className="flex-1 h-10 px-3 rounded-xl border border-[#E6E4DE] bg-white text-sm text-[#334155] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all"
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(idx)} className="h-8 w-8 flex items-center justify-center text-[#CBD5E1] hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button type="button" onClick={addOption} className="mt-2 flex items-center gap-1.5 text-xs text-[#1D4ED8] hover:underline font-semibold">
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-semibold text-[#334155] mb-1.5">
            Explanation <span className="font-normal text-[#94a3b8]">(shown after answering)</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain why the correct answer is right…"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-white text-[#334155] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!questionId && (
          <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer">
            <input
              type="checkbox"
              checked={addAnother}
              onChange={(e) => setAddAnother(e.target.checked)}
              className="h-4 w-4 rounded border-[#E6E4DE] text-[#1D4ED8] accent-[#1D4ED8]"
            />
            Add another after saving
          </label>
        )}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto flex items-center gap-2 h-11 px-6 rounded-xl bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold transition-all disabled:opacity-60 text-sm shadow-[0_4px_14px_rgba(232,114,42,0.3)]"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {questionId ? "Update" : "Save question"}</>}
        </button>
      </div>
    </form>
  );
}
