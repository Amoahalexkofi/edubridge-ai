import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import LessonEditor from "./_components/LessonEditor";

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { topic: preselectedTopic } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_target")
    .eq("id", user.id)
    .single();

  const teachingLevel = profile?.exam_target ?? null;

  const { data: allTopics } = await supabase
    .from("topics")
    .select("id, title, subject_id, order_index, subjects(name, exam_type)")
    .order("order_index");

  const topics = teachingLevel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (allTopics ?? []).filter((t: any) => t.subjects?.exam_type === teachingLevel)
    : allTopics;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/lessons" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Lessons
        </Link>
      </div>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">Create lesson</h1>
        <p className="text-sm text-[#64748B] mt-1">Add a new lesson to a topic</p>
      </div>
      <LessonEditor topics={topics ?? []} preselectedTopicId={preselectedTopic ?? null} />
    </div>
  );
}
