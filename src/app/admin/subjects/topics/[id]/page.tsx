import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import TopicContentManager from "./_components/TopicContentManager";

export default async function AdminTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, order_index, subject_id, subjects(id, name, slug, icon, exam_type)")
    .eq("id", id)
    .single();

  if (!topic) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subject = topic.subjects as any;

  const [{ data: lessons }, { data: questions }, { data: allTopics }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, order_index, content")
      .eq("topic_id", id)
      .order("order_index"),
    supabase
      .from("questions")
      .select("id, prompt, options, correct_answer, explanation, difficulty")
      .eq("topic_id", id)
      .order("created_at"),
    supabase
      .from("topics")
      .select("id, title, order_index, subject_id, subjects(name, exam_type)")
      .order("order_index"),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Breadcrumb */}
      <Link
        href="/admin/subjects"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#1D4ED8] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Subjects &amp; Topics
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E6E4DE] eb-card p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-[#F8F7F4] border border-[#E6E4DE] flex items-center justify-center text-3xl flex-shrink-0">
          {subject?.icon ?? "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
              {subject?.name} · {subject?.exam_type?.toUpperCase()}
            </span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a] mt-0.5 truncate">
            {topic.title}
          </h1>
        </div>
        {subject?.slug && (
          <Link
            href={`/student/subjects/${subject.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1D4ED8] transition-colors flex-shrink-0 px-3 py-1.5 rounded-lg hover:bg-[#F2F1EE]"
          >
            Preview <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <TopicContentManager
        topicId={topic.id}
        lessons={lessons ?? []}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions={(questions ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allTopics={(allTopics ?? []) as any}
      />
    </div>
  );
}
