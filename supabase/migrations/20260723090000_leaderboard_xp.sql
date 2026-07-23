-- Rank and score the leaderboard by the same XP formula the student dashboard
-- shows (10/lesson, 20/exam, +10 bonus per 80%+ score), instead of raw lesson
-- count. Previously "pts" on the leaderboard and "XP" on the dashboard sidebar
-- were different numbers for the same student. Mirrors LESSON_XP/EXAM_XP/
-- HIGH_SCORE_BONUS in src/lib/xp.ts — keep both in sync if the formula changes.

drop function if exists public.leaderboard(text);

create function public.leaderboard(p_exam_target text)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  lessons bigint,
  exams bigint,
  avg_score numeric,
  xp bigint
)
language sql stable security definer set search_path = public as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    coalesce(lp.lessons, 0) as lessons,
    coalesce(ea.exams, 0)   as exams,
    ea.avg_score,
    coalesce(lp.lessons, 0) * 10
      + coalesce(ea.exams, 0) * 20
      + coalesce(ea.high_score_exams, 0) * 10 as xp
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id and ur.role = 'student'
  left join (
    select user_id, count(*) as lessons
    from public.lesson_progress
    where completed = true
    group by user_id
  ) lp on lp.user_id = p.id
  left join (
    select user_id,
           count(*) as exams,
           round(avg((score::numeric / nullif(total_marks, 0)) * 100)) as avg_score,
           count(*) filter (where (score::numeric / nullif(total_marks, 0)) >= 0.8) as high_score_exams
    from public.exam_attempts
    where status = 'submitted' and score is not null and total_marks > 0
    group by user_id
  ) ea on ea.user_id = p.id
  where p.exam_target::text = p_exam_target
  order by xp desc;
$$;

grant execute on function public.leaderboard(text) to authenticated;
