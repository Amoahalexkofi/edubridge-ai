import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPremium } from "@/lib/pricing";
import PlannerClient from "./_components/PlannerClient";
import type { StudyPlan } from "@/lib/study-plan";

export default async function PlannerPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.app_verified === false) redirect("/student?verify=1");

  const [{ data: profile }, { data: planRow }, { data: subjects }] = await Promise.all([
    supabase.from("profiles").select("full_name, exam_target, subscription_tier, subscription_expires_at, trial_ends_at, grandfathered").eq("id", user.id).single(),
    supabase.from("study_plans").select("id, exam_date, plan").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("subjects")
      .select("id, name, icon")
      .order("name"),
  ]);

  if (!hasPremium(profile)) redirect("/student/upgrade");

  const examTarget = (profile?.exam_target ?? "bece").toUpperCase() as "BECE" | "WASSCE";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Subjects for the setup form, scoped to the student's exam target
  const { data: targetSubjects } = await supabase
    .from("subjects")
    .select("id, name, icon, topics(id)")
    .eq("exam_type", examTarget.toLowerCase())
    .order("name");

  return (
    <PlannerClient
      firstName={firstName}
      examTarget={examTarget}
      subjects={(targetSubjects ?? subjects ?? []).map(s => ({
        id: s.id,
        name: s.name,
        icon: (s as { icon?: string | null }).icon ?? null,
        topicCount: ((s as { topics?: { id: string }[] }).topics ?? []).length,
      }))}
      initialPlan={
        planRow
          ? { id: planRow.id, examDate: planRow.exam_date, plan: planRow.plan as StudyPlan }
          : null
      }
    />
  );
}
