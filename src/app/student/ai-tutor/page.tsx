import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AIChatClient from "./_components/AIChatClient";

export interface ExamContext {
  subject: string;
  score: number;
  correct: number;
  total: number;
  weakTopics: string[];
}

export default async function AITutorPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; subject?: string; score?: string; correct?: string; total?: string; weak?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const examTarget = (profile?.exam_target ?? "bece").toUpperCase() as "BECE" | "WASSCE";

  const sp = await searchParams;
  const examContext: ExamContext | undefined = sp.from === "exam" && sp.subject
    ? {
        subject: sp.subject,
        score: sp.score ? parseInt(sp.score) : 0,
        correct: sp.correct ? parseInt(sp.correct) : 0,
        total: sp.total ? parseInt(sp.total) : 0,
        weakTopics: sp.weak ? sp.weak.split(",").filter(Boolean) : [],
      }
    : undefined;

  return <AIChatClient firstName={firstName} examTarget={examTarget} examContext={examContext} />;
}
