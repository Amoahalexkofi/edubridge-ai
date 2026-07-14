import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sessionStatus } from "@/lib/exam-sessions";
import ExamTaker from "./_components/ExamTaker";

export default async function TakeExamPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; session?: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

  const { subject: subjectParam, session: sessionId } = await searchParams;

  // Session parameters (null for an ordinary on-demand mock)
  let subjectId = subjectParam ?? null;
  let durationMinutes = 40;
  let questionLimit = 40;
  let sessionIdToStore: string | null = null;

  if (sessionId) {
    const { data: session } = await supabase
      .from("exam_sessions")
      .select("id, subject_id, duration_minutes, question_count, starts_at, ends_at")
      .eq("id", sessionId)
      .single();
    if (!session) redirect("/student/exams?error=session_not_found");
    if (sessionStatus(session.starts_at, session.ends_at) !== "live") {
      redirect("/student/exams?error=session_closed");
    }
    // Already attempted? Send them to their result rather than starting again.
    const { data: existingRows } = await supabase
      .from("exam_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("started_at", { ascending: false })
      .limit(1);
    if (existingRows && existingRows.length > 0) {
      redirect(`/student/exams/${existingRows[0].id}`);
    }
    subjectId = session.subject_id;
    durationMinutes = session.duration_minutes;
    questionLimit = session.question_count;
    sessionIdToStore = session.id;
  }

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
    .select("id, prompt, options, correct_answer, explanation, image_url, topic_id, topics(title)")
    .in("topic_id", topicIds)
    .limit(300);

  if (!rawQuestions || rawQuestions.length === 0) redirect("/student/exams?error=no_questions");

  // Shuffle and take up to the requested count
  const questions = ([...rawQuestions] as unknown as Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    correct_answer: string;
    explanation: string | null;
    image_url: string | null;
    topic_id: string;
    topics: { title: string } | null;
  }>).sort(() => Math.random() - 0.5).slice(0, questionLimit);

  // Use service role for insert — RLS INSERT policy may not allow all columns
  const { data: attempt, error: insertError } = await admin
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      exam_type: subject.exam_type,
      total_marks: questions.length,
      status: "in_progress",
      session_id: sessionIdToStore,
    })
    .select("id")
    .single();

  if (!attempt || insertError) redirect("/student/exams?error=insert_failed");

  return (
    <ExamTaker
      attemptId={attempt.id}
      subject={subject}
      questions={questions}
      durationMinutes={durationMinutes}
    />
  );
}
