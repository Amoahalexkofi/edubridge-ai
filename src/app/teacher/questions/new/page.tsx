import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import QuestionEditor from "./_components/QuestionEditor";

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { topic } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_target")
    .eq("id", user.id)
    .single();

  const teachingLevel = profile?.exam_target ?? null;

  const topicsQuery = supabase
    .from("topics")
    .select("id, title, subject_id, subjects(name, exam_type)")
    .order("order_index");

  // If teacher has a level set, filter to only show their subjects
  const { data: allTopics } = await topicsQuery;
  const topics = teachingLevel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (allTopics ?? []).filter((t: any) => t.subjects?.exam_type === teachingLevel)
    : allTopics;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link href="/teacher/questions" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Questions
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0f172a]">Add question</h1>
        <p className="text-sm text-[#64748B] mt-1">Create an MCQ question for the question bank</p>
      </div>
      <QuestionEditor topics={topics ?? []} preselectedTopicId={topic ?? null} />
    </div>
  );
}
