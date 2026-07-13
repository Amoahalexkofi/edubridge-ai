"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen, PenLine, Plus, Pencil, Trash2, X, CheckCircle2, Sparkles, ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LessonEditor from "@/app/teacher/lessons/new/_components/LessonEditor";
import QuestionEditor from "@/app/teacher/questions/new/_components/QuestionEditor";
import QuestionImporter from "./QuestionImporter";

interface Lesson { id: string; title: string; order_index: number; content: string | null }
interface OptionItem { id: string; text: string }
interface Question {
  id: string; prompt: string; options: OptionItem[];
  correct_answer: string; explanation: string | null; difficulty: string | null;
  image_url: string | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopicOpt = { id: string; title: string; order_index: number; subject_id: string; subjects: any };

interface Props {
  topicId: string;
  lessons: Lesson[];
  questions: Question[];
  allTopics: TopicOpt[];
}

type Drawer =
  | { kind: "lesson-new" }
  | { kind: "lesson-edit"; lesson: Lesson }
  | { kind: "question-new" }
  | { kind: "question-edit"; question: Question }
  | { kind: "question-import" }
  | null;

const DIFF_STYLE: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-red-50 text-red-700",
};

export default function TopicContentManager({ topicId, lessons, questions, allTopics }: Props) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function onSaved(keepOpen?: boolean) {
    router.refresh();
    if (!keepOpen) setDrawer(null);
  }

  async function remove(table: "lessons" | "questions", id: string, label: string) {
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await createClient().from(table).delete().eq("id", id);
    setDeleting(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${label[0].toUpperCase()}${label.slice(1)} deleted.`);
    router.refresh();
  }

  return (
    <>
      {/* ── Lessons ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#1D4ED8]" />
            <h2 className="font-bold text-slate-900">Lessons</h2>
            <span className="text-xs font-bold text-slate-400 tabular-nums">{lessons.length}</span>
          </div>
          <button
            onClick={() => setDrawer({ kind: "lesson-new" })}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add lesson
          </button>
        </div>

        {lessons.length > 0 ? (
          <div className="space-y-2">
            {lessons.map((l, i) => (
              <div key={l.id} className="group flex items-center gap-3 bg-white rounded-xl border border-[#E6E4DE] eb-card p-3.5">
                <span className="h-8 w-8 rounded-lg bg-[#F2F1EE] text-[#64748B] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="flex-1 min-w-0 text-sm font-semibold text-slate-800 truncate">{l.title}</p>
                <button
                  onClick={() => setDrawer({ kind: "lesson-edit", lesson: l })}
                  className="h-8 px-3 rounded-lg text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] flex items-center gap-1.5 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove("lessons", l.id, "lesson")}
                  disabled={deleting === l.id}
                  className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Delete lesson"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-[#E6E4DE] p-8 text-center">
            <p className="text-sm text-slate-500">No lessons yet. Add the first one for this topic.</p>
          </div>
        )}
      </section>

      {/* ── Questions ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-[#E8722A]" />
            <h2 className="font-bold text-slate-900">Questions</h2>
            <span className="text-xs font-bold text-slate-400 tabular-nums">{questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawer({ kind: "question-import" })}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#1D4ED8] text-[#1D4ED8] hover:bg-[#EFF6FF] text-xs font-bold transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Import with AI
            </button>
            <button
              onClick={() => setDrawer({ kind: "question-new" })}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#E8722A] hover:bg-[#d4641e] text-white text-xs font-bold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add question
            </button>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((q) => {
              const correctText = q.options?.find((o) => o.id === q.correct_answer)?.text ?? "";
              return (
                <div key={q.id} className="group flex items-start gap-3 bg-white rounded-xl border border-[#E6E4DE] eb-card p-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{q.prompt}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                        <CheckCircle2 className="h-3 w-3" /> {q.correct_answer?.toUpperCase()}. {correctText}
                      </span>
                      {q.difficulty && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${DIFF_STYLE[q.difficulty] ?? "bg-slate-100 text-slate-500"}`}>
                          {q.difficulty}
                        </span>
                      )}
                      {q.image_url && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                          <ImageIcon className="h-3 w-3" /> Diagram
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawer({ kind: "question-edit", question: q })}
                    className="h-8 px-3 rounded-lg text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] flex items-center gap-1.5 flex-shrink-0 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => remove("questions", q.id, "question")}
                    disabled={deleting === q.id}
                    className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-[#E6E4DE] p-8 text-center">
            <p className="text-sm text-slate-500">No questions yet. Add practice questions for this topic.</p>
          </div>
        )}
      </section>

      {/* ── Slide-over editor ── */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40" onClick={() => setDrawer(null)} />
          <div className="w-full max-w-2xl bg-[#F4F3EF] h-full overflow-y-auto shadow-[-8px_0_40px_rgba(0,0,0,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur border-b border-[#E6E4DE] px-5 h-14">
              <p className="font-bold text-slate-900 text-sm">
                {drawer.kind === "lesson-new" && "New lesson"}
                {drawer.kind === "lesson-edit" && "Edit lesson"}
                {drawer.kind === "question-new" && "New question"}
                {drawer.kind === "question-edit" && "Edit question"}
                {drawer.kind === "question-import" && "Import questions with AI"}
              </p>
              <button onClick={() => setDrawer(null)} className="h-8 w-8 rounded-lg text-slate-500 hover:bg-[#F2F1EE] flex items-center justify-center" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              {(drawer.kind === "lesson-new" || drawer.kind === "lesson-edit") && (
                <LessonEditor
                  topics={allTopics}
                  preselectedTopicId={topicId}
                  lessonId={drawer.kind === "lesson-edit" ? drawer.lesson.id : undefined}
                  initialTitle={drawer.kind === "lesson-edit" ? drawer.lesson.title : ""}
                  initialContent={drawer.kind === "lesson-edit" ? (drawer.lesson.content ?? "") : ""}
                  onSaved={onSaved}
                />
              )}
              {(drawer.kind === "question-new" || drawer.kind === "question-edit") && (
                <QuestionEditor
                  topics={allTopics}
                  preselectedTopicId={topicId}
                  questionId={drawer.kind === "question-edit" ? drawer.question.id : undefined}
                  initialPrompt={drawer.kind === "question-edit" ? drawer.question.prompt : ""}
                  initialOptions={drawer.kind === "question-edit" ? drawer.question.options : undefined}
                  initialCorrect={drawer.kind === "question-edit" ? drawer.question.correct_answer : undefined}
                  initialExplanation={drawer.kind === "question-edit" ? (drawer.question.explanation ?? "") : ""}
                  initialDifficulty={drawer.kind === "question-edit" ? (drawer.question.difficulty ?? "medium") : undefined}
                  initialImageUrl={drawer.kind === "question-edit" ? drawer.question.image_url : null}
                  onSaved={onSaved}
                />
              )}
              {drawer.kind === "question-import" && (
                <QuestionImporter topicId={topicId} onSaved={onSaved} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
