import type { SupabaseClient } from "@supabase/supabase-js";
import { getTopicStats, weakTopics, type TopicStat } from "@/lib/recommendations";

/**
 * Study-plan generation (July workplan: "AI study planner").
 *
 * The schedule itself is deterministic — weak topics first (from real exam
 * data), then untouched topics, then the rest, with a weekly mock exam and a
 * final revision week. One small Claude call writes the personal coach note;
 * if it fails the plan still generates (fail open).
 */

export interface PlanItem {
  id: string;
  type: "study" | "practice" | "exam" | "review";
  title: string;
  subjectName?: string;
  href: string;
  done: boolean;
}

export interface PlanWeek {
  index: number;
  start: string; // ISO date (Monday-ish anchor: generation day + 7*i)
  focus: string;
  items: PlanItem[];
}

export interface StudyPlan {
  examDate: string;
  generatedAt: string;
  coachNote: string | null;
  weeks: PlanWeek[];
}

const MAX_WEEKS = 12;
const TOPICS_PER_WEEK_MIN = 3;
const TOPICS_PER_WEEK_MAX = 5;

type TopicRow = {
  id: string;
  title: string;
  subject_id: string;
  subjects: { id: string; name: string; slug: string | null } | null;
};

export async function generateStudyPlan(
  supabase: SupabaseClient,
  userId: string,
  examTarget: string,
  examDate: string,
  subjectIds: string[] | null,
): Promise<StudyPlan> {
  // 1. Candidate topics for the exam target (optionally filtered to chosen subjects)
  let topicQuery = supabase
    .from("topics")
    .select("id, title, subject_id, subjects!inner(id, name, slug, exam_type)")
    .eq("subjects.exam_type", examTarget.toLowerCase());
  if (subjectIds && subjectIds.length > 0) {
    topicQuery = topicQuery.in("subject_id", subjectIds);
  }
  const [{ data: topicRows }, { stats }, { data: progress }] = await Promise.all([
    topicQuery,
    getTopicStats(supabase, userId),
    supabase.from("lesson_progress").select("lessons(topic_id)").eq("user_id", userId),
  ]);

  const topics = (topicRows ?? []) as unknown as TopicRow[];
  const weak = weakTopics(stats);
  const weakById = new Map(weak.map(w => [w.topicId, w]));
  const statById = new Map(stats.map(s => [s.topicId, s]));
  const startedTopicIds = new Set(
    ((progress ?? []) as unknown as { lessons: { topic_id: string | null } | null }[])
      .map(p => p.lessons?.topic_id)
      .filter(Boolean) as string[],
  );

  // 2. Priority order: weak (weakest first) → untouched → already-started-but-unproven
  const prioritised = [...topics].sort((a, b) => {
    const rank = (t: TopicRow) => {
      if (weakById.has(t.id)) return 0;
      if (!startedTopicIds.has(t.id) && !statById.has(t.id)) return 1;
      return 2;
    };
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    const wa = weakById.get(a.id)?.pct ?? 100;
    const wb = weakById.get(b.id)?.pct ?? 100;
    return wa - wb;
  });

  // 3. Week math
  const now = new Date();
  const end = new Date(examDate + "T00:00:00Z");
  const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
  const weeksAvailable = Math.max(1, Math.min(MAX_WEEKS, Math.floor(daysLeft / 7)));
  const studyWeeks = Math.max(1, weeksAvailable - 1); // last week is revision

  const perWeek = Math.min(
    TOPICS_PER_WEEK_MAX,
    Math.max(TOPICS_PER_WEEK_MIN, Math.ceil(prioritised.length / studyWeeks)),
  );

  const subjectsInPlan = new Map<string, { name: string; id: string }>();
  for (const t of topics) {
    if (t.subjects) subjectsInPlan.set(t.subjects.id, { name: t.subjects.name, id: t.subjects.id });
  }
  const subjectRotation = Array.from(subjectsInPlan.values());

  // 4. Assemble weeks
  const weeks: PlanWeek[] = [];
  let cursor = 0;
  for (let w = 0; w < studyWeeks && cursor < prioritised.length; w++) {
    const slice = prioritised.slice(cursor, cursor + perWeek);
    cursor += perWeek;

    const items: PlanItem[] = [];
    for (const t of slice) {
      const weakStat = weakById.get(t.id);
      const subjName = t.subjects?.name ?? "";
      items.push({
        id: `w${w + 1}-s-${t.id}`,
        type: "study",
        title: weakStat ? `Relearn ${t.title} (scored ${weakStat.pct}%)` : `Study ${t.title}`,
        subjectName: subjName,
        href: t.subjects?.slug ? `/student/subjects/${t.subjects.slug}` : "/student/subjects",
        done: false,
      });
      if (weakStat) {
        items.push({
          id: `w${w + 1}-p-${t.id}`,
          type: "practice",
          title: `Practice ${t.title} until it clicks`,
          subjectName: subjName,
          href: `/student/practice?subject=${t.subject_id}`,
          done: false,
        });
      }
    }
    // Weekly mock, rotating subjects
    const mockSubject = subjectRotation[w % Math.max(1, subjectRotation.length)];
    if (mockSubject) {
      items.push({
        id: `w${w + 1}-e`,
        type: "exam",
        title: `Take a timed ${mockSubject.name} mock exam`,
        subjectName: mockSubject.name,
        href: "/student/exams",
        done: false,
      });
    }

    const weekStart = new Date(now.getTime() + w * 7 * 86_400_000);
    const hasWeak = slice.some(t => weakById.has(t.id));
    weeks.push({
      index: w + 1,
      start: weekStart.toISOString().slice(0, 10),
      focus: hasWeak ? "Fix weak areas first" : "Cover new ground",
      items,
    });
  }

  // 5. Final revision week
  const revStart = new Date(now.getTime() + weeks.length * 7 * 86_400_000);
  const revisionItems: PlanItem[] = [
    ...weak.slice(0, 3).map((wk, i) => ({
      id: `rev-p-${i}`,
      type: "practice" as const,
      title: `Final drill: ${wk.title}`,
      subjectName: wk.subjectName,
      href: wk.subjectId ? `/student/practice?subject=${wk.subjectId}` : "/student/practice",
      done: false,
    })),
    {
      id: "rev-e1",
      type: "exam",
      title: "Full mock exam under real timing",
      href: "/student/exams",
      done: false,
    },
    {
      id: "rev-r1",
      type: "review",
      title: "Review every mock result — read each explanation you got wrong",
      href: "/student/exams",
      done: false,
    },
  ];
  weeks.push({
    index: weeks.length + 1,
    start: revStart.toISOString().slice(0, 10),
    focus: "Final revision — sharpen and rest",
    items: revisionItems,
  });

  return {
    examDate,
    generatedAt: now.toISOString(),
    coachNote: null, // filled by the API route (AI, fail-open)
    weeks,
  };
}

export function planProgress(plan: StudyPlan): { done: number; total: number; pct: number } {
  let done = 0, total = 0;
  for (const w of plan.weeks) for (const i of w.items) { total++; if (i.done) done++; }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function summariseWeakForCoach(stats: TopicStat[]): string {
  const weak = weakTopics(stats).slice(0, 4);
  if (weak.length === 0) return "No weak topics detected yet — they haven't taken many exams.";
  return weak.map(w => `${w.title} (${w.pct}%)`).join(", ");
}
