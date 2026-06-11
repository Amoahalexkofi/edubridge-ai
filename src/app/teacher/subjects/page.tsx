import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, ChevronRight, Plus } from "lucide-react";
import AddSubjectForm from "./_components/AddSubjectForm";
import AddTopicForm from "./_components/AddTopicForm";

export default async function TeacherSubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, exam_type, description, topics(id, name, order_index)")
    .order("exam_type")
    .order("name");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Subjects & Topics</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage the curriculum structure</p>
        </div>
      </div>

      {/* Add Subject */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
        <h2 className="font-bold text-[#0f172a] mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#E8722A]" /> Add new subject
        </h2>
        <AddSubjectForm />
      </div>

      {/* Subjects list */}
      {subjects && subjects.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">
            All subjects ({subjects.length})
          </h2>
          {subjects.map((subject) => (
            <div key={subject.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
              {/* Subject header */}
              <div className="flex items-center gap-3 p-4 border-b border-[#F1F5F9]">
                <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-xl flex-shrink-0">
                  {subject.icon ?? "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#0f172a]">{subject.name}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1D4ED8] text-white">{subject.exam_type}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{subject.topics?.length ?? 0} topics</p>
                </div>
                <Link href={`/student/subjects/${subject.slug}`} target="_blank" className="text-xs text-[#1D4ED8] hover:underline flex-shrink-0 flex items-center gap-1">
                  Preview <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Topics */}
              <div className="p-4 space-y-3">
                {subject.topics && subject.topics.length > 0 && (
                  <div className="space-y-1.5">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(subject.topics as any[]).sort((a, b) => a.order_index - b.order_index).map((topic: { id: string; name: string; order_index: number }) => (
                      <div key={topic.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC] text-sm">
                        <span className="h-5 w-5 rounded flex items-center justify-center text-xs font-bold text-[#94a3b8] flex-shrink-0">
                          {topic.order_index}
                        </span>
                        <span className="flex-1 text-[#334155] font-medium">{topic.name}</span>
                        <Link href={`/teacher/lessons?topic=${topic.id}`} className="text-xs text-[#1D4ED8] hover:underline">
                          Add lesson
                        </Link>
                        <Link href={`/teacher/questions?topic=${topic.id}`} className="text-xs text-[#E8722A] hover:underline">
                          Add questions
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                <AddTopicForm subjectId={subject.id} nextOrder={(subject.topics?.length ?? 0) + 1} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] py-14 text-center">
          <BookOpen className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#334155]">No subjects yet</p>
          <p className="text-sm text-[#94a3b8] mt-1">Add the first subject above to get started.</p>
        </div>
      )}
    </div>
  );
}
