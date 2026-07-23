// Single source of truth for the XP formula and level thresholds, shared by the
// student dashboard and the leaderboard (whose `leaderboard` RPC mirrors this
// formula in SQL — keep supabase/migrations/*_leaderboard_xp.sql in sync with
// these constants if they ever change).

export const LESSON_XP = 10;
export const EXAM_XP = 20;
export const HIGH_SCORE_BONUS = 10;

export const LEVELS = [
  { level: 1, label: "Beginner", min: 0 },
  { level: 2, label: "Explorer", min: 500 },
  { level: 3, label: "Achiever", min: 1000 },
  { level: 4, label: "Scholar", min: 2000 },
  { level: 5, label: "Champion", min: 4000 },
] as const;

export function getLevel(xp: number) {
  return [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
}
