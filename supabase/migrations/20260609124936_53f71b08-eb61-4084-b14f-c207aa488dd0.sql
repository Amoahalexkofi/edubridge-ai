
-- Remove broad table-level privileges; replace with column-scoped UPDATE so
-- students cannot supply grade columns (score/total_marks/is_correct/marks_awarded)
-- via the Data API even if the protective triggers are ever dropped.

REVOKE ALL ON public.exam_attempts FROM anon, authenticated;
REVOKE ALL ON public.attempt_answers FROM anon, authenticated;

-- exam_attempts: students may read/insert their own rows, and update only
-- status + submitted_at on rows they own (enforced by existing RLS policy).
GRANT SELECT, INSERT ON public.exam_attempts TO authenticated;
GRANT UPDATE (status, submitted_at) ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;

-- attempt_answers: students may read/insert their own answers, and update
-- only the `answer` column on rows tied to their own attempts.
GRANT SELECT, INSERT ON public.attempt_answers TO authenticated;
GRANT UPDATE (answer) ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
