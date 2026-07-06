import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BookOpen, Library, GraduationCap, FileText, Medal, Trophy, Star,
  Flame, Layers, CalendarCheck, TrendingUp, type LucideIcon,
} from "lucide-react";

/**
 * Badge engine (July workplan: gamification — badges).
 *
 * Earned states are computed from data students already generate (lessons,
 * exams, streaks, plans) and persisted to user_badges so each badge has an
 * earned date and can be celebrated once. Awarding runs with the student's
 * own client on dashboard/profile load — insert-only RLS, no service role.
 */

export interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  /** Tailwind classes for the earned state chip */
  tint: string;
  /** Human hint shown while locked, given current stats */
  hint: (s: BadgeStats) => string;
  earned: (s: BadgeStats) => boolean;
}

export interface BadgeStats {
  lessonsCompleted: number;
  examCount: number;
  bestPct: number;          // best mock score %
  streak: number;           // consecutive days
  subjectCount: number;     // distinct subjects with a submitted mock
  hasPlan: boolean;
  bestImprovement: number;  // biggest first→latest score gain in one subject (pts)
}

export const BADGES: BadgeDef[] = [
  {
    id: "first_lesson", title: "First Steps", desc: "Complete your first lesson",
    icon: BookOpen, tint: "bg-blue-50 text-[#1D4ED8] border-blue-100",
    earned: s => s.lessonsCompleted >= 1,
    hint: () => "Complete 1 lesson",
  },
  {
    id: "lessons_10", title: "Bookworm", desc: "Complete 10 lessons",
    icon: Library, tint: "bg-green-50 text-[#1A6B3C] border-green-100",
    earned: s => s.lessonsCompleted >= 10,
    hint: s => `${Math.min(s.lessonsCompleted, 10)}/10 lessons`,
  },
  {
    id: "lessons_50", title: "Scholar", desc: "Complete 50 lessons",
    icon: GraduationCap, tint: "bg-[#1B3A8A]/8 text-[#1B3A8A] border-[#1B3A8A]/15",
    earned: s => s.lessonsCompleted >= 50,
    hint: s => `${Math.min(s.lessonsCompleted, 50)}/50 lessons`,
  },
  {
    id: "first_exam", title: "Mock Rookie", desc: "Sit your first mock exam",
    icon: FileText, tint: "bg-purple-50 text-purple-600 border-purple-100",
    earned: s => s.examCount >= 1,
    hint: () => "Take 1 mock exam",
  },
  {
    id: "exams_10", title: "Exam Veteran", desc: "Sit 10 mock exams",
    icon: Medal, tint: "bg-purple-50 text-purple-700 border-purple-100",
    earned: s => s.examCount >= 10,
    hint: s => `${Math.min(s.examCount, 10)}/10 mock exams`,
  },
  {
    id: "high_score", title: "80% Club", desc: "Score 80%+ on a mock exam",
    icon: Trophy, tint: "bg-amber-50 text-amber-600 border-amber-100",
    earned: s => s.bestPct >= 80,
    hint: s => s.examCount > 0 ? `Best so far: ${s.bestPct}%` : "Take a mock exam first",
  },
  {
    id: "perfect_paper", title: "Perfect Paper", desc: "Score 100% on a mock exam",
    icon: Star, tint: "bg-amber-50 text-[#F59E0B] border-amber-100",
    earned: s => s.bestPct >= 100,
    hint: s => s.examCount > 0 ? `Best so far: ${s.bestPct}%` : "Take a mock exam first",
  },
  {
    id: "streak_3", title: "Warming Up", desc: "Study 3 days in a row",
    icon: Flame, tint: "bg-orange-50 text-[#E8722A] border-orange-100",
    earned: s => s.streak >= 3,
    hint: s => `Current streak: ${s.streak} day${s.streak === 1 ? "" : "s"}`,
  },
  {
    id: "streak_7", title: "On Fire", desc: "Study 7 days in a row",
    icon: Flame, tint: "bg-red-50 text-red-500 border-red-100",
    earned: s => s.streak >= 7,
    hint: s => `Current streak: ${s.streak} day${s.streak === 1 ? "" : "s"}`,
  },
  {
    id: "all_rounder", title: "All-Rounder", desc: "Sit mocks in 3 different subjects",
    icon: Layers, tint: "bg-teal-50 text-[#0D9488] border-teal-100",
    earned: s => s.subjectCount >= 3,
    hint: s => `${Math.min(s.subjectCount, 3)}/3 subjects`,
  },
  {
    id: "strategist", title: "The Strategist", desc: "Create your study plan",
    icon: CalendarCheck, tint: "bg-blue-50 text-[#1D4ED8] border-blue-100",
    earned: s => s.hasPlan,
    hint: () => "Build a plan in Study Planner",
  },
  {
    id: "comeback", title: "The Comeback", desc: "Improve a subject score by 20+ points",
    icon: TrendingUp, tint: "bg-green-50 text-[#1A6B3C] border-green-100",
    earned: s => s.bestImprovement >= 20,
    hint: s => s.bestImprovement > 0 ? `Best improvement: +${s.bestImprovement} pts` : "Retake a mock to improve",
  },
];

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const uniqueDays = [...new Set(dates.map(d => d.split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = Math.round((new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export interface BadgeState {
  stats: BadgeStats;
  /** badge_id → earned_at ISO */
  earned: Record<string, string>;
  /** ids newly awarded on this load — celebrate these once */
  newlyEarned: string[];
}

export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string,
): Promise<BadgeState> {
  const [
    { count: lessonsCompleted },
    { data: streakRows },
    { data: attempts },
    { data: plan },
    { data: existingRows },
  ] = await Promise.all([
    supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    supabase.from("lesson_progress").select("last_viewed_at").eq("user_id", userId).eq("completed", true).order("last_viewed_at", { ascending: false }).limit(365),
    supabase.from("exam_attempts").select("subject_id, score, total_marks, submitted_at").eq("user_id", userId).eq("status", "submitted").not("score", "is", null).order("submitted_at", { ascending: true }),
    supabase.from("study_plans").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
  ]);

  const pcts = (attempts ?? []).map(a => a.total_marks ? Math.round((a.score / a.total_marks) * 100) : 0);
  const bySubject: Record<string, number[]> = {};
  for (const a of attempts ?? []) {
    if (!a.subject_id || !a.total_marks) continue;
    (bySubject[a.subject_id] ??= []).push(Math.round((a.score / a.total_marks) * 100));
  }
  let bestImprovement = 0;
  for (const scores of Object.values(bySubject)) {
    if (scores.length >= 2) {
      bestImprovement = Math.max(bestImprovement, Math.max(...scores.slice(1)) - scores[0]);
    }
  }

  const stats: BadgeStats = {
    lessonsCompleted: lessonsCompleted ?? 0,
    examCount: (attempts ?? []).length,
    bestPct: pcts.length ? Math.max(...pcts) : 0,
    streak: calculateStreak((streakRows ?? []).map(r => r.last_viewed_at as string)),
    subjectCount: Object.keys(bySubject).length,
    hasPlan: !!plan,
    bestImprovement,
  };

  const earned: Record<string, string> = {};
  for (const row of existingRows ?? []) earned[row.badge_id] = row.earned_at;

  let newlyEarned = BADGES.filter(b => b.earned(stats) && !earned[b.id]).map(b => b.id);
  if (newlyEarned.length > 0) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("user_badges")
      .upsert(newlyEarned.map(badge_id => ({ user_id: userId, badge_id, earned_at: now })), { onConflict: "user_id,badge_id", ignoreDuplicates: true });
    if (error) {
      // Table missing or write failed — don't celebrate (it would repeat every
      // load) and don't mark as earned; the page still renders fine.
      console.warn("[badges] award failed:", error.message);
      newlyEarned = [];
    } else {
      for (const id of newlyEarned) earned[id] = now;
    }
  }

  return { stats, earned, newlyEarned };
}
