import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PenLine, Plus, Pencil } from "lucide-react";

export default async function TeacherQuestionsPage({
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
    .select("id, title, subjects(name, exam_type)")
    .order("order_index");

  const query = supabase
    .from("questions")
    .select("id, prompt, difficulty, topic_id, topics(title, subjects(name))")
    .order("created_at", { ascending: false });

  const { data: questions } = topicId
    ? await query.eq("topic_id", topicId)
    : await query.limit(50);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Question Bank</h1>
          <p className="text-sm text-[#64748B] mt-1">MCQ questions for practice and exams</p>
        </div>
        <Link
          href={topicId ? `/teacher/questions/new?topic=${topicId}` : "/teacher/questions/new"}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#E8722A] hover:bg-[#d4641e] text-white text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New question
        </Link>
      </div>

      {/* Topic filter */}
      {topics && topics.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link href="/teacher/questions" className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${!topicId ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#1D4ED8]/40"}`}>
            All
          </Link>
          {topics.map((t) => (
            <Link key={t.id} href={`/teacher/questions?topic=${t.id}`} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${topicId === t.id ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#1D4ED8]/40"}`}>
              {(t as any).title}
            </Link>
          ))}
        </div>
      )}

      {/* Questions list */}
      {questions && questions.length > 0 ? (
        <div className="space-y-2">
          {questions.map((q, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const topic = q.topics as any;
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-start gap-3">
                <span className="h-6 w-6 rounded-lg bg-[#F1F5F9] text-xs font-bold text-[#94a3b8] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0f172a] font-medium leading-snug">{q.prompt}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-[#94a3b8]">{topic?.subjects?.name} · {topic?.title}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                      q.difficulty === "easy" ? "bg-green-50 text-green-700" :
                      q.difficulty === "hard" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>{q.difficulty}</span>
                  </div>
                </div>
                <Link href={`/teacher/questions/${q.id}/edit`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8]/40 flex-shrink-0">
                  <Pencil className="h-3 w-3" /> Edit
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-14 text-center">
          <PenLine className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155]">No questions yet</p>
          <p className="text-sm text-[#94a3b8] mt-1 mb-4">Add questions to build the practice and exam bank.</p>
          <Link href="/teacher/questions/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8722A] text-white text-sm font-bold hover:bg-[#d4641e] transition-colors">
            <Plus className="h-4 w-4" /> Add first question
          </Link>
        </div>
      )}
    </div>
  );
}
