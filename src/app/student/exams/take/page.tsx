import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import ExamTaker from "./_components/ExamTaker";

export default async function TakeExamPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { subject: subjectId } = await searchParams;
  if (!subjectId) redirect("/student/exams");

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, icon, exam_type")
    .eq("id", subjectId)
    .single();

  if (!subject) redirect("/student/exams");

  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId);

  if (!topics || topics.length === 0) redirect("/student/exams?error=no_questions");

  const topicIds = topics.map((t) => t.id);

  // Service role required — correct_answer is revoked from authenticated users
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rawQuestions } = await admin
    .from("questions")
    .select("id, prompt, options, correct_answer, explanation, topic_id, topics(title)")
    .in("topic_id", topicIds)
    .limit(60);

  if (!rawQuestions || rawQuestions.length === 0) redirect("/student/exams?error=no_questions");

  // Shuffle and take up to 40
  const questions = ([...rawQuestions] as unknown as Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    correct_answer: string;
    explanation: string | null;
    topic_id: string;
    topics: { title: string } | null;
  }>).sort(() => Math.random() - 0.5).slice(0, 40);

  // Use service role for insert — RLS INSERT policy may not allow all columns
  const { data: attempt, error: insertError } = await admin
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      exam_type: subject.exam_type,
      total_marks: questions.length,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (!attempt || insertError) redirect("/student/exams?error=insert_failed");

  return (
    <ExamTaker
      attemptId={attempt.id}
      subject={subject}
      questions={questions}
      durationMinutes={40}
    />
  );
}
