import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LessonEditor from "../../new/_components/LessonEditor";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, content, topic_id")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, subject_id, order_index, subjects(name, exam_type)")
    .order("order_index");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link href="/teacher/lessons" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0f172a] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Lessons
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0f172a]">Edit lesson</h1>
        <p className="text-sm text-[#64748B] mt-1">{lesson.title}</p>
      </div>
      <LessonEditor
        topics={topics ?? []}
        preselectedTopicId={lesson.topic_id}
        lessonId={lesson.id}
        initialTitle={lesson.title}
        initialContent={lesson.content ?? ""}
      />
    </div>
  );
}
