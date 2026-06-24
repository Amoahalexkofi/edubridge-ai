import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email to submit exams." }, { status: 403 });

  const { attemptId, answers } = await req.json() as {
    attemptId: string;
    answers: Record<string, string>;
  };

  if (!attemptId || !answers) {
    return NextResponse.json({ error: "Missing attemptId or answers" }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify this attempt belongs to this user
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, user_id, status")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.status === "submitted") {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }

  // Calculate score server-side using service role (correct_answer is revoked from clients)
  const questionIds = Object.keys(answers);
  const { data: questions } = await admin
    .from("questions")
    .select("id, correct_answer")
    .in("id", questionIds.length > 0 ? questionIds : ["none"]);

  const score = (questions ?? []).filter((q) => answers[q.id] === q.correct_answer).length;
  const total_marks = questionIds.length;

  const { error } = await admin
    .from("exam_attempts")
    .update({
      answers,
      score,
      total_marks,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Exam submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, score, total_marks, attemptId });
}
