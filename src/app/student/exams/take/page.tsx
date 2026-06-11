import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Get all topics for this subject
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId);

  if (!topics || topics.length === 0) {
    redirect(`/student/exams?error=no_questions`);
  }

  const topicIds = topics.map((t) => t.id);

  // Get questions (up to 40, shuffled)
  const { data: rawQuestions } = await supabase
    .from("questions")
    .select("id, body, options, correct_option, explanation, topic_id, topics(name)")
    .in("topic_id", topicIds)
    .limit(60);

  if (!rawQuestions || rawQuestions.length === 0) {
    redirect(`/student/exams?error=no_questions`);
  }

  // Shuffle and take 40
  const questions = (rawQuestions as unknown[])
    .sort(() => Math.random() - 0.5)
    .slice(0, 40) as Array<{
      id: string;
      body: string;
      options: Array<{ id: string; text: string }>;
      correct_option: string;
      explanation: string | null;
      topic_id: string;
      topics: { name: string } | null;
    }>;

  // Create an attempt record
  const { data: attempt } = await supabase
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

  if (!attempt) redirect("/student/exams");

  return (
    <ExamTaker
      attemptId={attempt.id}
      subject={subject}
      questions={questions}
      durationMinutes={40}
    />
  );
}
