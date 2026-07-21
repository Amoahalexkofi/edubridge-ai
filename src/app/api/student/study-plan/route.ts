import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { generateStudyPlan, summariseWeakForCoach } from "@/lib/study-plan";
import { getTopicStats } from "@/lib/recommendations";
import { hasPremium } from "@/lib/pricing";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.user_metadata?.app_verified === false) {
    return Response.json({ error: "Verify your email to use the Study Planner." }, { status: 403 });
  }

  const { examDate, subjectIds } = await request.json();

  // Exam date must be a real future date within two years
  const date = new Date(`${examDate}T00:00:00Z`);
  const daysAway = (date.getTime() - Date.now()) / 86_400_000;
  if (isNaN(date.getTime()) || daysAway < 3 || daysAway > 730) {
    return Response.json({ error: "Pick an exam date at least a few days from now." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, exam_target, subscription_tier, subscription_expires_at, trial_ends_at, grandfathered")
    .eq("id", user.id)
    .single();
  if (!hasPremium(profile)) {
    return Response.json({ error: "Upgrade to Premium to use the Study Planner." }, { status: 403 });
  }
  const examTarget = profile?.exam_target ?? "bece";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const plan = await generateStudyPlan(
    supabase,
    user.id,
    examTarget,
    examDate,
    Array.isArray(subjectIds) && subjectIds.length > 0 ? subjectIds : null,
  );

  // Personal coach note — one small AI call, fail-open
  try {
    const { stats } = await getTopicStats(supabase, user.id);
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      maxTokens: 200,
      prompt: `You are EduBridge AI Tutor, a warm Ghanaian exam coach. Write a 2-3 sentence personal note for ${firstName}, a ${examTarget.toUpperCase()} candidate whose exam is on ${examDate} (${Math.round(daysAway)} days away). Their weak topics from recent mock exams: ${summariseWeakForCoach(stats)}. Their study plan has ${plan.weeks.length} weeks. Be encouraging and specific — mention their weakest topic by name if there is one. No greetings like "Dear", just start talking. No markdown.`,
    });
    plan.coachNote = text.trim();
  } catch {
    // Plan works without the note
  }

  const { data: saved, error } = await supabase
    .from("study_plans")
    .upsert(
      {
        user_id: user.id,
        exam_date: examDate,
        subject_ids: subjectIds ?? [],
        plan,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id, exam_date, plan")
    .single();

  if (error) {
    console.error("[study-plan] save failed:", error.message);
    return Response.json({ error: "Could not save your plan. Please try again." }, { status: 500 });
  }

  return Response.json(saved);
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await supabase.from("study_plans").delete().eq("user_id", user.id);
  return Response.json({ ok: true });
}
