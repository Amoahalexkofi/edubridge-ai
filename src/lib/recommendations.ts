import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Adaptive study recommendations (July workplan: "adaptive learning engine
 * and AI recommendation algorithms").
 *
 * Pure data — no AI calls, so recommendations are instant and free. Weak-topic
 * detection mirrors the exam-results page: answers jsonb on exam_attempts is
 * re-scored against questions.correct_answer, grouped by topic.
 */

export interface Recommendation {
  kind: "weak_topic" | "new_subject" | "first_exam" | "retry_exam";
  title: string;
  detail: string;
  href: string;
  /** Percentage score that triggered this recommendation (weak_topic / retry_exam). */
  pct?: number;
  subjectName?: string;
}

const WEAK_THRESHOLD = 60; // % — same bar as the exam results page
const MIN_QUESTIONS = 2;   // don't judge a topic on a single question

export interface TopicStat {
  topicId: string;
  title: string;
  subjectId: string | null;
  subjectName: string;
  correct: number;
  total: number;
  pct: number;
}

/**
 * Per-topic accuracy across the student's recent submitted exams,
 * re-scored from exam_attempts.answers (same method as the results page).
 * Sorted weakest first. Shared by dashboard recommendations and the study planner.
 */
export async function getTopicStats(
  supabase: SupabaseClient,
  userId: string,
  attemptLimit = 5,
): Promise<{ stats: TopicStat[]; attempts: AttemptRow[] }> {
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, subject_id, score, total_marks, answers, submitted_at, subjects(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(attemptLimit);

  const recentAttempts = (attempts ?? []) as unknown as AttemptRow[];
  const questionIds = new Set<string>();
  for (const a of recentAttempts) {
    for (const qid of Object.keys(a.answers ?? {})) questionIds.add(qid);
  }
  if (questionIds.size === 0) return { stats: [], attempts: recentAttempts };

  const { data: questions } = await supabase
    .from("questions")
    .select("id, correct_answer, topic_id, topics(id, title, subject_id)")
    .in("id", Array.from(questionIds));

  const byId = new Map(((questions ?? []) as unknown as QuestionRow[]).map(q => [q.id, q]));
  const raw: Record<string, Omit<TopicStat, "pct" | "topicId"> & { topicId: string }> = {};

  for (const a of recentAttempts) {
    for (const [qid, chosen] of Object.entries(a.answers ?? {})) {
      const q = byId.get(qid);
      if (!q?.topic_id) continue;
      raw[q.topic_id] ??= {
        topicId: q.topic_id,
        title: q.topics?.title ?? "Topic",
        subjectId: q.topics?.subject_id ?? a.subject_id,
        subjectName: a.subjects?.name ?? "",
        correct: 0,
        total: 0,
      };
      raw[q.topic_id].total++;
      if (chosen === q.correct_answer) raw[q.topic_id].correct++;
    }
  }

  const stats = Object.values(raw)
    .map(s => ({ ...s, pct: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);
  return { stats, attempts: recentAttempts };
}

export function weakTopics(stats: TopicStat[]): TopicStat[] {
  return stats.filter(s => s.total >= MIN_QUESTIONS && s.pct < WEAK_THRESHOLD);
}

type AttemptRow = {
  id: string;
  subject_id: string | null;
  score: number | null;
  total_marks: number | null;
  answers: Record<string, string> | null;
  submitted_at: string | null;
  subjects: { id: string; name: string; slug: string | null } | null;
};

type QuestionRow = {
  id: string;
  correct_answer: string;
  topic_id: string | null;
  topics: { id: string; title: string; subject_id: string | null } | null;
};

export async function getRecommendations(
  supabase: SupabaseClient,
  userId: string,
  examTarget: string,
): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];

  // ── 1. Weak topics from recent exams ────────────────────────────────────
  const { stats, attempts: recentAttempts } = await getTopicStats(supabase, userId);
  for (const w of weakTopics(stats).slice(0, 3)) {
    recs.push({
      kind: "weak_topic",
      title: `Strengthen: ${w.title}`,
      detail: `You scored ${w.pct}% on this topic in recent exams — a little practice here moves your grade the most.`,
      href: w.subjectId ? `/student/practice?subject=${w.subjectId}` : "/student/practice",
      pct: w.pct,
      subjectName: w.subjectName,
    });
  }

  // ── 2. A subject they haven't touched yet ───────────────────────────────
  if (recs.length < 3) {
    const [{ data: subjects }, { data: progress }] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, slug, topics(id)")
        .eq("exam_type", examTarget.toLowerCase()),
      supabase
        .from("lesson_progress")
        .select("lessons(topics(subject_id))")
        .eq("user_id", userId),
    ]);

    const touched = new Set<string>();
    for (const a of recentAttempts) if (a.subject_id) touched.add(a.subject_id);
    for (const p of (progress ?? []) as unknown as { lessons: { topics: { subject_id: string | null } | null } | null }[]) {
      const sid = p.lessons?.topics?.subject_id;
      if (sid) touched.add(sid);
    }

    const untouched = ((subjects ?? []) as unknown as { id: string; name: string; slug: string | null; topics: { id: string }[] }[])
      .filter(s => !touched.has(s.id) && (s.topics?.length ?? 0) > 0)
      .sort((a, b) => (b.topics?.length ?? 0) - (a.topics?.length ?? 0));

    if (untouched[0]) {
      recs.push({
        kind: "new_subject",
        title: `Start ${untouched[0].name}`,
        detail: `You haven't opened this subject yet — it has ${untouched[0].topics.length} topics waiting for you.`,
        href: untouched[0].slug ? `/student/subjects/${untouched[0].slug}` : "/student/subjects",
        subjectName: untouched[0].name,
      });
    }
  }

  // ── 3. No exams yet → nudge toward the first mock ───────────────────────
  if (recentAttempts.length === 0) {
    recs.push({
      kind: "first_exam",
      title: "Take your first mock exam",
      detail: "A 15-minute mock shows exactly where you stand — and unlocks personalised recommendations here.",
      href: "/student/exams",
    });
  } else if (recs.length < 3) {
    // ── 4. Retry the weakest recent exam ──────────────────────────────────
    const weakest = recentAttempts
      .filter(a => a.score != null && a.total_marks)
      .sort((a, b) => (a.score! / a.total_marks!) - (b.score! / b.total_marks!))[0];
    if (weakest && weakest.total_marks && (weakest.score! / weakest.total_marks) * 100 < 80) {
      const pct = Math.round((weakest.score! / weakest.total_marks) * 100);
      recs.push({
        kind: "retry_exam",
        title: `Beat your ${pct}% in ${weakest.subjects?.name ?? "your last exam"}`,
        detail: "Retake the mock and watch your score climb — repetition is how toppers are made.",
        href: "/student/exams",
        pct,
        subjectName: weakest.subjects?.name ?? undefined,
      });
    }
  }

  return recs.slice(0, 3);
}
