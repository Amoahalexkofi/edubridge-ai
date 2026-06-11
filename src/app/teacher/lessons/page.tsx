import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FileText, Plus, Pencil } from "lucide-react";

export default async function TeacherLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { topic: topicId } = await searchParams;

  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, subject_id, subjects(name, exam_type)")
    .order("order_index");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, topic_id, topics(name, subjects(name))")
    .eq(topicId ? "topic_id" : "topic_id", topicId ?? "")
    .order("order_index");

  // If no filter, show all
  const { data: allLessons } = topicId
    ? { data: lessons }
    : await supabase
        .from("lessons")
        .select("id, title, order_index, topic_id, topics(name, subjects(name))")
        .order("order_index");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Lessons</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {topicId
              ? `Showing lessons for selected topic`
              : `All lessons across all subjects`}
          </p>
        </div>
        <Link
          href={topicId ? `/teacher/lessons/new?topic=${topicId}` : "/teacher/lessons/new"}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#E8722A] hover:bg-[#d4641e] text-white text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New lesson
        </Link>
      </div>

      {/* Topic filter */}
      {topics && topics.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/teacher/lessons"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              !topicId ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#1D4ED8]/40"
            }`}
          >
            All
          </Link>
          {topics.map((t) => (
            <Link
              key={t.id}
              href={`/teacher/lessons?topic=${t.id}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                topicId === t.id ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#1D4ED8]/40"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      {/* Lessons */}
      {allLessons && allLessons.length > 0 ? (
        <div className="space-y-2">
          {allLessons.map((lesson) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const topic = lesson.topics as any;
            return (
              <div key={lesson.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#1D4ED8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0f172a]">{lesson.title}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {topic?.subjects?.name} · {topic?.name}
                  </p>
                </div>
                <Link
                  href={`/teacher/lessons/${lesson.id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8]/40 transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-14 text-center">
          <FileText className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155]">No lessons yet</p>
          <p className="text-sm text-[#94a3b8] mt-1 mb-4">Create the first lesson to give students content to study.</p>
          <Link href="/teacher/lessons/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8722A] text-white text-sm font-bold hover:bg-[#d4641e] transition-colors">
            <Plus className="h-4 w-4" /> Create first lesson
          </Link>
        </div>
      )}
    </div>
  );
}
