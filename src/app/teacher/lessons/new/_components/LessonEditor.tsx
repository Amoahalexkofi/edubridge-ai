"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Topic = {
  id: string;
  title: string;
  order_index: number;
  subject_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subjects: any;
};

interface Props {
  topics: Topic[];
  preselectedTopicId: string | null;
  lessonId?: string;
  initialTitle?: string;
  initialContent?: string;
}

export default function LessonEditor({
  topics,
  preselectedTopicId,
  lessonId,
  initialTitle = "",
  initialContent = "",
}: Props) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(preselectedTopicId ?? topics[0]?.id ?? "");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !topicId) { toast.error("Title and topic are required."); return; }
    setSaving(true);

    const supabase = createClient();

    if (lessonId) {
      const { error } = await supabase
        .from("lessons")
        .update({ title: title.trim(), content, topic_id: topicId, updated_at: new Date().toISOString() })
        .eq("id", lessonId);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Lesson updated!");
      router.refresh();
    } else {
      const { data: existing } = await supabase
        .from("lessons")
        .select("order_index")
        .eq("topic_id", topicId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const orderIndex = (existing?.order_index ?? 0) + 1;

      const { data, error } = await supabase
        .from("lessons")
        .insert({ title: title.trim(), content, topic_id: topicId, order_index: orderIndex })
        .select("id")
        .single();

      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Lesson created!");
      router.push(`/teacher/lessons/${data.id}/edit`);
    }
  }

  const inputCls = "w-full h-11 px-4 rounded-xl border border-[#E6E4DE] bg-white text-[#0f172a] text-sm placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all";

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 space-y-4">

        {/* Topic selector */}
        <div>
          <label className="block text-sm font-semibold text-[#334155] mb-1.5">Topic</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            required
            className={inputCls}
          >
            <option value="">Select a topic…</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.subjects?.name} ({t.subjects?.exam_type}) · {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-[#334155] mb-1.5">Lesson title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Fractions"
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Content editor */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-[#334155]">Lesson content</label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-1.5 text-xs text-[#1D4ED8] hover:underline font-semibold"
          >
            {preview ? <><EyeOff className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
          </button>
        </div>
        <p className="text-xs text-[#94a3b8] mb-3">
          Use # for headings, ## for sub-headings, - for bullet points. Separate paragraphs with a blank line.
        </p>
        {preview ? (
          <div className="min-h-[300px] border border-[#E6E4DE] rounded-xl p-4 bg-[#F8F7F4] prose prose-slate max-w-none text-sm space-y-3">
            {content.split(/\n{2,}/).filter(Boolean).map((para, i) => {
              if (para.startsWith("# ")) return <h2 key={i} className="text-base font-bold text-[#0f172a]">{para.slice(2)}</h2>;
              if (para.startsWith("## ")) return <h3 key={i} className="text-sm font-bold text-[#334155]">{para.slice(3)}</h3>;
              if (para.startsWith("- ")) {
                const items = para.split("\n").filter(Boolean);
                return <ul key={i} className="list-disc pl-5 space-y-1">{items.map((item, j) => <li key={j} className="text-[#334155] text-sm">{item.replace(/^- /, "")}</li>)}</ul>;
              }
              return <p key={i} className="text-[#334155] leading-relaxed">{para}</p>;
            })}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`# Introduction\n\nWrite your lesson content here.\n\n## Key Points\n\n- Point one\n- Point two\n\nExplain the main concept clearly...`}
            rows={16}
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-white text-[#334155] text-sm font-mono placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all resize-none"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 flex items-center justify-center gap-2 bg-[#E8722A] hover:bg-[#d4641e] text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm shadow-[0_4px_14px_rgba(232,114,42,0.3)]"
      >
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {lessonId ? "Update lesson" : "Create lesson"}</>}
      </button>
    </form>
  );
}
