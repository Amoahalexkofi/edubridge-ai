-- Leaderboard aggregation done in the database (GROUP BY) instead of pulling every
-- student's full lesson/exam history to the server and counting in JS. Returns one
-- ranked row per student for the given exam target. Used by the leaderboard page and
-- the dashboard teaser. security definer so it sees all students regardless of RLS.

create or replace function public.leaderboard(p_exam_target text)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  lessons bigint,
  exams bigint,
  avg_score numeric
)
language sql stable security definer set search_path = public as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    coalesce(lp.lessons, 0) as lessons,
    coalesce(ea.exams, 0)   as exams,
    ea.avg_score
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
           round(avg((score::numeric / nullif(total_marks, 0)) * 100)) as avg_score
    from public.exam_attempts
    where status = 'submitted' and score is not null and total_marks > 0
    group by user_id
  ) ea on ea.user_id = p.id
  where p.exam_target::text = p_exam_target
  order by lessons desc, exams desc;
$$;

grant execute on function public.leaderboard(text) to authenticated;
