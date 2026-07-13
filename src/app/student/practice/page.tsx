import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import PracticeClient from "./_components/PracticeClient";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_target")
    .eq("id", user.id)
    .single();

  const examTarget = profile?.exam_target ?? "BECE";
  const { subject: subjectId } = await searchParams;

  // Load all subjects for this exam type
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, color")
    .eq("exam_type", examTarget.toLowerCase())
    .order("name");

  // If a specific subject is selected (or first available), load its questions
  const activeSubjectId = subjectId ?? subjects?.[0]?.id;

  let questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    correct_answer: string;
    explanation: string | null;
    image_url: string | null;
    topic_id: string;
    topics: { title: string } | null;
  }> = [];

  if (activeSubjectId) {
    // Get all topic IDs for this subject
    const { data: topicIds } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", activeSubjectId);

    if (topicIds && topicIds.length > 0) {
      const ids = topicIds.map((t) => t.id);
      const { data: rawQuestions } = await supabase
        .from("questions")
        .select("id, prompt, options, correct_answer, explanation, image_url, topic_id, topics(title)")
        .in("topic_id", ids)
        .limit(20);

      // Shuffle
      questions = ((rawQuestions ?? []) as unknown[]).sort(() => Math.random() - 0.5) as typeof questions;
    }
  }

  return (
    <PracticeClient
      subjects={subjects ?? []}
      activeSubjectId={activeSubjectId ?? null}
      questions={questions}
      examTarget={examTarget}
    />
  );
}
