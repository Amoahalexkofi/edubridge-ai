import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPremium } from "@/lib/pricing";
import AIChatClient, { type ChatSession } from "./_components/AIChatClient";

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
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1"); // unverified students are limited to dashboard + profile

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, subscription_tier, subscription_expires_at, trial_ends_at, grandfathered")
    .eq("id", user.id)
    .single();

  if (!hasPremium(profile)) redirect("/student/upgrade");

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const examTarget = (profile?.exam_target ?? "bece").toUpperCase() as "BECE" | "WASSCE";

  // Chat history is stored per-account so it survives sign-out and follows
  // the student across devices (localStorage is wiped at sign-out by design).
  const { data: chatRows } = await supabase
    .from("ai_chat_sessions")
    .select("id, title, type, exam_context, messages, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  const initialSessions: ChatSession[] = (chatRows ?? []).map(r => ({
    id: r.id,
    title: r.title,
    type: r.type as "exam" | "general",
    examContext: r.exam_context ?? undefined,
    messages: Array.isArray(r.messages) ? r.messages : [],
    createdAt: r.created_at,
  }));

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

  return <AIChatClient userId={user.id} firstName={firstName} examTarget={examTarget} examContext={examContext} initialSessions={initialSessions} />;
}
