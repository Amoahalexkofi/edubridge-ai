"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye, EyeOff, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadContentImage } from "@/lib/uploads";
import LessonContent from "@/app/student/lessons/[id]/_components/LessonContent";

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
  /** When provided, called after a successful save instead of navigating —
      lets the editor be reused inline (e.g. the topic content manager). */
  onSaved?: () => void;
}

export default function LessonEditor({
  topics,
  preselectedTopicId,
  lessonId,
  initialTitle = "",
  initialContent = "",
  onSaved,
}: Props) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(preselectedTopicId ?? topics[0]?.id ?? "");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  async function handleImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await uploadContentImage(form);
    setUploading(false);
    if (res.error || !res.url) { toast.error(res.error ?? "Upload failed."); return; }

    // Insert markdown image at the cursor (alt text doubles as a caption)
    const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    const snippet = `\n\n![${alt}](${res.url})\n\n`;
    const el = textareaRef.current;
    if (el) {
      const at = el.selectionStart ?? content.length;
      setContent(content.slice(0, at) + snippet + content.slice(at));
    } else {
      setContent(content + snippet);
    }
    toast.success("Image inserted.");
    if (imgInputRef.current) imgInputRef.current.value = "";
  }

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
      if (onSaved) onSaved(); else router.refresh();
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
      if (onSaved) onSaved(); else router.push(`/teacher/lessons/${data.id}/edit`);
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
          <div className="flex items-center gap-3">
            <input
              ref={imgInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
            />
            {!preview && (
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-[#1D4ED8] hover:underline font-semibold disabled:opacity-60"
              >
                {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</> : <><ImagePlus className="h-3.5 w-3.5" /> Insert image</>}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 text-xs text-[#1D4ED8] hover:underline font-semibold"
            >
              {preview ? <><EyeOff className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
            </button>
          </div>
        </div>
        <p className="text-xs text-[#94a3b8] mb-3">
          Use # for headings, ## for sub-headings, - for bullet points. Separate paragraphs with a blank line.
          Add diagrams with <b>Insert image</b> — they appear where your cursor is.
        </p>
        {preview ? (
          <div className="min-h-[300px] border border-[#E6E4DE] rounded-xl p-4 bg-[#F8F7F4]">
            {content.trim()
              ? <LessonContent content={content} />
              : <p className="text-sm text-[#94a3b8]">Nothing to preview yet — write some content first.</p>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
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
