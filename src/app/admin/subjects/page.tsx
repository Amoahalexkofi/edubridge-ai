import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { BookOpen, ExternalLink, Hash } from "lucide-react";
import Link from "next/link";
import AddTopicForm from "../../teacher/subjects/_components/AddTopicForm";
import AddSubjectPanel from "./_components/AddSubjectPanel";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, exam_type, description, topics(id, title, order_index)")
    .order("exam_type")
    .order("name");

  const all = subjects ?? [];
  const bece = all.filter((s) => s.exam_type === "bece");
  const wassce = all.filter((s) => s.exam_type === "wassce");
  const totalTopics = all.reduce((sum, s) => sum + (s.topics?.length ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Subjects & Topics</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage the curriculum structure for BECE and WASSCE</p>
        </div>
        <AddSubjectPanel />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Subjects</p>
          <p className="text-3xl font-black text-[#0f172a] tabular-nums mt-1">{all.length}</p>
        </div>
        <div className="bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE] p-4">
          <p className="text-xs font-semibold text-[#1D4ED8] uppercase tracking-wider">BECE</p>
          <p className="text-3xl font-black text-[#1D4ED8] tabular-nums mt-1">{bece.length}</p>
        </div>
        <div className="bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] p-4">
          <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider">WASSCE</p>
          <p className="text-3xl font-black text-[#15803D] tabular-nums mt-1">{wassce.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-4">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Topics</p>
          <p className="text-3xl font-black text-[#0f172a] tabular-nums mt-1">{totalTopics}</p>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F2F1EE] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-[#CBD5E1]" />
          </div>
          <p className="font-bold text-[#334155]">No subjects yet</p>
          <p className="text-sm text-[#94a3b8] mt-1">Click &ldquo;Add Subject&rdquo; to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          <SubjectSection title="BECE" accentColor="blue" subjects={bece} />
          <SubjectSection title="WASSCE" accentColor="green" subjects={wassce} />
        </div>
      )}
    </div>
  );
}

type SubjectWithTopics = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  exam_type: string;
  description: string | null;
  topics: { id: string; title: string; order_index: number }[] | null;
};

function SubjectSection({
  title,
  accentColor,
  subjects,
}: {
  title: string;
  accentColor: "blue" | "green";
  subjects: SubjectWithTopics[];
}) {
  const badge = accentColor === "blue" ? "bg-[#1D4ED8] text-white" : "bg-[#15803D] text-white";
  const header = accentColor === "blue" ? "text-[#1D4ED8]" : "text-[#15803D]";

  if (subjects.length === 0) {
    return (
      <div>
        <SectionHeader title={title} count={0} badge={badge} header={header} />
        <div className="bg-white rounded-2xl border border-dashed border-[#E6E4DE] py-10 text-center mt-3">
          <p className="text-sm text-[#94a3b8]">No {title} subjects yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader title={title} count={subjects.length} badge={badge} header={header} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {subjects.map((subject) => {
        const sortedTopics = (subject.topics ?? []).slice().sort((a, b) => a.order_index - b.order_index);
        return (
          <div
            key={subject.id}
            className="bg-white rounded-2xl border border-[#E6E4DE] overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Subject header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="h-11 w-11 rounded-xl bg-[#F8F7F4] border border-[#E6E4DE] flex items-center justify-center text-2xl flex-shrink-0">
                {subject.icon ?? "📚"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[#0f172a]">{subject.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
                    {title}
                  </span>
                </div>
                {subject.description && (
                  <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{subject.description}</p>
                )}
              </div>
              <Link
                href={`/student/subjects/${subject.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1D4ED8] transition-colors flex-shrink-0 px-3 py-1.5 rounded-lg hover:bg-[#F2F1EE]"
              >
                Preview <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#F2F1EE] mx-5" />

            {/* Topics */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-[#CBD5E1]" />
                <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  {sortedTopics.length} {sortedTopics.length === 1 ? "topic" : "topics"}
                </span>
              </div>

              {sortedTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sortedTopics.map((topic) => (
                    <span
                      key={topic.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E4DE] bg-[#F8F7F4] text-xs font-medium text-[#475569]"
                    >
                      <span className="text-[10px] font-bold text-[#CBD5E1]">{topic.order_index}</span>
                      {topic.title}
                    </span>
                  ))}
                </div>
              )}

              <AddTopicForm subjectId={subject.id} nextOrder={sortedTopics.length + 1} />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  badge,
  header,
}: {
  title: string;
  count: number;
  badge: string;
  header: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-bold uppercase tracking-widest ${header}`}>{title}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{count}</span>
      <div className="flex-1 h-px bg-[#E2E8F0]" />
    </div>
  );
}
